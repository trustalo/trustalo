/**
 * Postgres LISTEN/NOTIFY bus for cross-node, push-based fan-out of
 * TenantContextProposal lifecycle events.
 *
 * Why this exists
 * ───────────────
 * The chat UI subscribes to /chat/proposals/stream to render a live
 * "pending proposals" panel. The original implementation polled the
 * database every 3 seconds per open SSE connection, which produced
 * heavy log noise and wasted DB time on idle pages.
 *
 * Postgres NOTIFY is broadcast to every LISTEN-ing session across the
 * entire database (any node, any process), so a single channel here
 * lets a producer on Node A push an event that an SSE handler on
 * Node Z receives. No Redis pub/sub or extra broker required.
 *
 * Multi-node correctness
 * ──────────────────────
 * • One persistent `pg.Client` per process holds the LISTEN. Every
 *   producer in the same process reuses the same client for NOTIFY.
 * • TCP keepalive + a 30-second `SELECT 1` heartbeat catch half-open
 *   sockets (firewall idle drops, NAT timeouts, Postgres failover)
 *   so a wedged listener cannot indefinitely back up
 *   pg_notification_queue.
 * • On reconnect we fire a synthetic event to every subscriber, so
 *   any notifications missed during the gap are healed on the next
 *   refresh tick the SSE handler performs.
 *
 * Tenant isolation
 * ────────────────
 * The notification payload carries the producing org's id. Subscribers
 * register by orgId; we only invoke handlers that match. The single
 * shared channel ("proposal_changed") avoids LISTEN churn as orgs come
 * and go.
 */

import pg from "pg";

// ── Tunables ──────────────────────────────────────────────────────
const CHANNEL = "proposal_changed";
const HEARTBEAT_INTERVAL_MS = 30_000;
const HEARTBEAT_TIMEOUT_MS = 5_000;
// Bounded exponential backoff: 1s, 2s, 5s (cap). Kept short because
// the listener is the only thing keeping NOTIFYs flowing — a long
// backoff would translate directly to UI staleness for every org with
// an open chat panel on this node.
const RECONNECT_BACKOFF_MS = [1_000, 2_000, 5_000];

export type ProposalChangeReason = "created" | "accepted" | "rejected" | "reconnect";

interface ProposalChangePayload {
  reason: ProposalChangeReason;
}

type Handler = (payload: ProposalChangePayload) => void;

// ── In-process subscriber map ─────────────────────────────────────
//
// orgId → set of handlers. Sets give O(1) add/remove and guarantee
// no double-invocation if the same handler is registered twice (it
// won't be, but cheap insurance).
const subscribers = new Map<string, Set<Handler>>();

// ── Connection state ──────────────────────────────────────────────
let listenerClient: pg.Client | null = null;
let connecting: Promise<pg.Client> | null = null;
let reconnectAttempt = 0;
let heartbeatTimer: NodeJS.Timeout | null = null;
let shuttingDown = false;

function getConnectionString(): string {
  const url = process.env.API_DATABASE_URL;
  if (!url) {
    throw new Error("API_DATABASE_URL is not set; pg-listener cannot connect.");
  }
  return url;
}

/**
 * Lazily build (and on failure, rebuild) the long-lived listener
 * connection. Callers should always await this — never reach into
 * `listenerClient` directly, since it can be `null` between a
 * disconnect and the next reconnect.
 */
async function ensureClient(): Promise<pg.Client> {
  if (listenerClient) return listenerClient;
  if (connecting) return connecting;

  connecting = (async () => {
    const client = new pg.Client({
      connectionString: getConnectionString(),
      // OS-level keepalives so a dead peer is detected within minutes
      // even if no application traffic is flowing. Complements the
      // application-level heartbeat below.
      keepAlive: true,
      keepAliveInitialDelayMillis: 10_000,
    });

    client.on("notification", handleNotification);
    client.on("error", (err) => {
      // `error` can fire either during a query or asynchronously on
      // the underlying socket. Either way the safe response is to
      // tear down and reconnect.
      console.warn("[pg-listener] client error", { error: err.message });
      void teardownAndReconnect(client);
    });
    client.on("end", () => {
      // Fires after a graceful close OR after an error-driven close.
      // If we initiated shutdown, do nothing; otherwise reconnect.
      if (shuttingDown) return;
      console.warn("[pg-listener] connection ended unexpectedly");
      void teardownAndReconnect(client);
    });

    await client.connect();
    await client.query(`LISTEN ${CHANNEL}`);

    listenerClient = client;
    reconnectAttempt = 0;
    startHeartbeat();
    return client;
  })();

  try {
    return await connecting;
  } catch (err) {
    // Failed to connect at all — schedule a retry and surface the
    // failure to the caller. The next subscribe/notify will retry.
    console.warn("[pg-listener] initial connect failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    scheduleReconnect();
    throw err;
  } finally {
    connecting = null;
  }
}

function startHeartbeat(): void {
  stopHeartbeat();
  heartbeatTimer = setInterval(() => {
    void runHeartbeat();
  }, HEARTBEAT_INTERVAL_MS);
  // Don't keep the event loop alive solely for the heartbeat —
  // process exit shouldn't be blocked by this timer.
  heartbeatTimer.unref?.();
}

function stopHeartbeat(): void {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}

/**
 * Liveness probe. If the query throws or hangs past
 * HEARTBEAT_TIMEOUT_MS, treat the connection as dead and reconnect.
 * This is the layer that catches half-open sockets — TCP keepalive
 * alone takes minutes on most stacks.
 */
async function runHeartbeat(): Promise<void> {
  const client = listenerClient;
  if (!client) return;

  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("heartbeat timeout")), HEARTBEAT_TIMEOUT_MS),
  );

  try {
    await Promise.race([client.query("SELECT 1"), timeout]);
  } catch (err) {
    console.warn("[pg-listener] heartbeat failed; reconnecting", {
      error: err instanceof Error ? err.message : String(err),
    });
    void teardownAndReconnect(client);
  }
}

/**
 * Force-close a (possibly-broken) client and queue a reconnect.
 * Idempotent: callers can fire it from multiple event handlers
 * without worrying about double-disconnect.
 */
async function teardownAndReconnect(client: pg.Client): Promise<void> {
  if (listenerClient !== client) {
    // A newer client has already taken over — nothing to do.
    return;
  }

  listenerClient = null;
  stopHeartbeat();

  try {
    await client.end();
  } catch {
    // Best effort. The socket may already be gone.
  }

  scheduleReconnect();
}

function scheduleReconnect(): void {
  if (shuttingDown) return;
  const delay = RECONNECT_BACKOFF_MS[Math.min(reconnectAttempt, RECONNECT_BACKOFF_MS.length - 1)];
  reconnectAttempt += 1;

  setTimeout(() => {
    void (async () => {
      try {
        await ensureClient();
        // Heal any notifications missed during the outage by giving
        // every subscriber a synthetic kick. The SSE handlers
        // re-fetch on every event, so this collapses to "one extra
        // findMany per active stream".
        broadcastReconnect();
      } catch {
        // ensureClient already logged + scheduled the next retry.
      }
    })();
  }, delay).unref?.();
}

function broadcastReconnect(): void {
  for (const handlers of subscribers.values()) {
    for (const handler of handlers) {
      try {
        handler({ reason: "reconnect" });
      } catch (err) {
        console.warn("[pg-listener] subscriber threw on reconnect", {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  }
}

function handleNotification(msg: pg.Notification): void {
  if (msg.channel !== CHANNEL) return;

  let parsed: { orgId?: unknown; reason?: unknown } = {};
  try {
    parsed = msg.payload ? JSON.parse(msg.payload) : {};
  } catch (err) {
    console.warn("[pg-listener] malformed payload", {
      payload: msg.payload,
      error: err instanceof Error ? err.message : String(err),
    });
    return;
  }

  const orgId = typeof parsed.orgId === "string" ? parsed.orgId : null;
  const reason = isReason(parsed.reason) ? parsed.reason : "created";
  if (!orgId) return;

  const handlers = subscribers.get(orgId);
  if (!handlers || handlers.size === 0) return;

  for (const handler of handlers) {
    try {
      handler({ reason });
    } catch (err) {
      console.warn("[pg-listener] subscriber threw", {
        orgId,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
}

function isReason(value: unknown): value is ProposalChangeReason {
  return (
    value === "created" || value === "accepted" || value === "rejected" || value === "reconnect"
  );
}

// ── Public API ────────────────────────────────────────────────────

/**
 * Subscribe to proposal-changed events for a single organization.
 * Returns an `unsubscribe` function the caller MUST invoke on
 * teardown (e.g. SSE `req.on("close")`) to avoid leaking handlers.
 *
 * The subscription is fire-and-forget for the connection itself —
 * if the listener can't connect right now, the unsubscribe is still
 * valid and the handler will start receiving events once the
 * connection comes up.
 */
export function subscribeProposalChanged(tenantId: string, handler: Handler): () => void {
  let handlers = subscribers.get(tenantId);
  if (!handlers) {
    handlers = new Set();
    subscribers.set(tenantId, handlers);
  }
  handlers.add(handler);

  // Kick off (or piggyback on) the connection without blocking the
  // caller. ensureClient already handles its own retry on failure.
  void ensureClient().catch(() => {
    // Already logged inside ensureClient; subscriber stays registered.
  });

  return () => {
    const set = subscribers.get(tenantId);
    if (!set) return;
    set.delete(handler);
    if (set.size === 0) {
      subscribers.delete(tenantId);
    }
  };
}

/**
 * Emit a proposal-changed event for an organization. Safe to call
 * from any node — Postgres broadcasts to every LISTEN-ing session.
 *
 * Producers should fire-and-forget (the chat turn must not fail
 * because the notification did). Errors are logged and swallowed.
 */
export async function notifyProposalChanged(
  tenantId: string,
  reason: Exclude<ProposalChangeReason, "reconnect">,
): Promise<void> {
  try {
    const client = await ensureClient();
    const payload = JSON.stringify({ orgId: tenantId, reason });
    await client.query("SELECT pg_notify($1, $2)", [CHANNEL, payload]);
  } catch (err) {
    // Notify failures are non-fatal — the SSE safety refresh will
    // pick up the change within ~60s. Log so we can spot a sustained
    // outage in metrics.
    console.warn("[pg-listener] notify failed", {
      tenantId,
      reason,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/**
 * Optional: explicit shutdown for tests / graceful process exit.
 * Stops the heartbeat, clears subscribers, closes the client.
 */
export async function shutdownPgListener(): Promise<void> {
  shuttingDown = true;
  stopHeartbeat();
  subscribers.clear();
  const client = listenerClient;
  listenerClient = null;
  if (client) {
    try {
      await client.end();
    } catch {
      // Ignore — we're tearing down anyway.
    }
  }
}
