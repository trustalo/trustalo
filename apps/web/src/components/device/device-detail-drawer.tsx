"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InfoDrawer } from "@/components/ui/info-drawer";
import {
  apiClient,
  type AvDetail,
  type DeviceDetail,
  type DevicePostureSnapshot,
  type DeviceStatus,
} from "@/lib/api-client";
import {
  avProductLabel,
  CORE_SIGNALS as SIGNALS,
  DEFAULT_REQUIRED_SIGNALS,
  EXTENDED_SIGNALS as POSTURE_EXTRA,
} from "@/lib/device-signals";
import { usePermissions } from "@/lib/use-permissions";

const STATUS_BADGE: Record<DeviceStatus, BadgeVariant> = {
  active: "success",
  pending: "info",
  stale: "warning",
  revoked: "danger",
  retired: "neutral",
};

const PLATFORM_LABEL: Record<string, string> = {
  macos: "macOS",
  windows: "Windows",
  linux: "Linux",
};

// Hardware facts the agent reports inside latestPosture.
const HARDWARE_FIELDS: { key: string; label: string; fmt?: (v: unknown) => string }[] = [
  { key: "model", label: "Model" },
  { key: "manufacturer", label: "Manufacturer" },
  { key: "serialNumber", label: "Serial number" },
  { key: "cpu", label: "Processor" },
  { key: "cpuCores", label: "CPU cores" },
  { key: "memoryBytes", label: "Memory", fmt: fmtBytes },
  { key: "diskTotalBytes", label: "Disk total", fmt: fmtBytes },
  { key: "diskFreeBytes", label: "Disk free", fmt: fmtBytes },
  { key: "arch", label: "Architecture" },
];

// Operating-system facts the agent reports inside latestPosture.
const OS_FIELDS: { key: string; label: string; fmt?: (v: unknown) => string }[] = [
  { key: "osBuild", label: "Build" },
  { key: "kernel", label: "Kernel" },
  { key: "uptimeSeconds", label: "Uptime", fmt: fmtUptime },
];

// latestPosture keys rendered explicitly above (or internal). Anything NOT in
// here falls through to the generic "Reported details" section, so a new signal
// the agent starts reporting still shows up with zero UI change.
const KNOWN_RAW_KEYS = new Set<string>([
  "collector",
  "screenLockDelaySeconds",
  // Endpoint-protection fields are rendered by the dedicated section below.
  // `avHealth` is already covered via POSTURE_EXTRA; exclude the rest explicitly.
  "avDetail",
  "avProducts",
  ...HARDWARE_FIELDS.map((f) => f.key),
  ...OS_FIELDS.map((f) => f.key),
  ...POSTURE_EXTRA.map((f) => f.key),
]);

function present(v: unknown): boolean {
  return v !== undefined && v !== null && v !== "";
}

function signalBadge(state: string) {
  const v: BadgeVariant = state === "pass" ? "success" : state === "fail" ? "danger" : "neutral";
  return <Badge variant={v}>{state}</Badge>;
}

function fmtDate(s: string | null | undefined): string {
  if (!s) return "—";
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

function fmtInterval(seconds: number): string {
  if (!seconds) return "—";
  if (seconds % 3600 === 0) return `${seconds / 3600} h`;
  if (seconds % 60 === 0) return `${seconds / 60} min`;
  return `${seconds}s`;
}

function fmtBytes(v: unknown): string {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n) || n <= 0) return "—";
  const gb = n / 1024 ** 3;
  if (gb >= 1024) return `${(gb / 1024).toFixed(1)} TB`;
  if (gb >= 1) return `${gb >= 10 ? Math.round(gb) : gb.toFixed(1)} GB`;
  return `${Math.round(n / 1024 ** 2)} MB`;
}

function fmtUptime(v: unknown): string {
  const s = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(s) || s <= 0) return "—";
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

// Annotates the screen-lock signal with its grace delay (0 → "immediate").
function fmtScreenLockDelay(v: unknown): string {
  if (!present(v)) return "";
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n) || n < 0) return "";
  if (n === 0) return "immediate";
  if (n % 60 === 0) return `after ${n / 60} min`;
  return `after ${n}s`;
}

// latestPosture is a free-form blob. Render unknown values as readable text.
function fmtRawValue(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "boolean") return v ? "yes" : "no";
  if (typeof v === "string" || typeof v === "number") return String(v);
  return JSON.stringify(v);
}

const ACRONYMS = new Set(["cpu", "os", "ip", "mdm", "sip", "id", "ram", "url", "av"]);

function humanizeKey(k: string): string {
  return k
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .split(" ")
    .map((w) =>
      ACRONYMS.has(w.toLowerCase()) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1),
    )
    .join(" ");
}

const AV_STALE_DEFS_HOURS = 48;
const AV_BAD_SCANS = new Set(["infected", "error", "missing"]);

// Collapses the agent's two daemon signals into one health verdict plus a short
// human note, so the drawer shows a single meaningful "Daemon" row.
function combineDaemon(
  active: string,
  responsive: string,
): { state: "pass" | "fail" | "unknown"; note: string } {
  if (active === "fail") return { state: "fail", note: "not running" };
  if (responsive === "fail") return { state: "fail", note: "not responding" };
  if (active === "pass" || responsive === "pass") return { state: "pass", note: "" };
  return { state: "unknown", note: "" };
}

// Effective definition age in hours — prefers the agent-reported value, falling
// back to a value derived from the timestamp when only that is present.
function avDefinitionsAgeHours(av: AvDetail): number | undefined {
  if (typeof av.definitionsAgeHours === "number") return av.definitionsAgeHours;
  if (av.definitionsUpdatedAt) {
    const t = new Date(av.definitionsUpdatedAt).getTime();
    if (!Number.isNaN(t)) return (Date.now() - t) / 3_600_000;
  }
  return undefined;
}

function fmtAgeHours(hours: number): string {
  if (!Number.isFinite(hours) || hours < 0) return "";
  if (hours < 1) return "< 1h ago";
  if (hours < 48) return `${Math.round(hours)}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

// Shortens a long file path while keeping the start and end readable.
function truncateMiddle(s: string, max = 44): string {
  if (s.length <= max) return s;
  const keep = Math.floor((max - 1) / 2);
  return `${s.slice(0, keep)}…${s.slice(s.length - keep)}`;
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5">
      <span className="shrink-0 text-neutral-500">{label}</span>
      <span className="break-all text-right font-medium text-neutral-800 dark:text-neutral-200">
        {children}
      </span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-neutral-200 pt-4 first:border-t-0 first:pt-0 dark:border-neutral-800">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
        {title}
      </h3>
      {children}
    </section>
  );
}

// Marks a signal the tenant has NOT opted to evaluate — a fail here is shown
// but never counted as a posture issue.
function OptionalTag() {
  return (
    <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500">
      optional
    </span>
  );
}

/**
 * The canonical "everything about this device" view. Built once and opened
 * in place from both the People → person → Devices tab and the fleet Device
 * posture summary. Fetches the full device detail + recent posture history by
 * id, so it behaves identically wherever it is opened.
 */
export function DeviceDetailDrawer({
  deviceId,
  onClose,
  onChanged,
}: {
  deviceId: string | null;
  onClose: () => void;
  /** Called after a mutation (e.g. revoke) so the opener can refresh its list. */
  onChanged?: () => void;
}) {
  const { canWrite } = usePermissions();
  const canManage = canWrite("assets");
  const [device, setDevice] = useState<DeviceDetail | null>(null);
  const [history, setHistory] = useState<DevicePostureSnapshot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (id: string) => {
    setLoading(true);
    setError("");
    try {
      const [d, h] = await Promise.all([
        apiClient.getDevice(id),
        apiClient.getDevicePostureHistory(id, 10).catch(() => null),
      ]);
      setDevice(d.data);
      setHistory(h?.data.items ?? []);
    } catch (err) {
      setError((err as Error)?.message || "Failed to load device");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!deviceId) {
      setDevice(null);
      setHistory([]);
      setError("");
      return;
    }
    void load(deviceId);
  }, [deviceId, load]);

  async function revoke() {
    if (!device) return;
    if (!confirm("Revoke this device? Its agent check-ins will be rejected.")) return;
    setBusy(true);
    try {
      await apiClient.revokeDevice(device.id);
      await load(device.id);
      onChanged?.();
    } catch (err) {
      setError((err as Error)?.message || "Failed to revoke device");
    } finally {
      setBusy(false);
    }
  }

  const title = device?.hostname || device?.asset?.name || "Device";
  const lp: Record<string, unknown> = device?.latestPosture ?? {};
  const required = new Set(device?.requiredSignals ?? DEFAULT_REQUIRED_SIGNALS);
  // Only EVALUATED signals that are failing count as posture issues — optional
  // ones are shown but never raise the red callout.
  const issues = device
    ? [
        ...SIGNALS.filter((s) => required.has(s.key) && device[s.key] === "fail").map(
          (s) => s.label,
        ),
        ...POSTURE_EXTRA.filter((f) => required.has(f.key) && lp[f.key] === "fail").map(
          (f) => f.label,
        ),
      ]
    : [];
  const screenLockSuffix = fmtScreenLockDelay(lp.screenLockDelaySeconds);
  const postureExtraRows = POSTURE_EXTRA.filter((f) => present(lp[f.key]));
  const hardwareRows = HARDWARE_FIELDS.filter((f) => present(lp[f.key]));
  const osRows = OS_FIELDS.filter((f) => present(lp[f.key]));
  const rawEntries = Object.entries(lp).filter(([k, v]) => !KNOWN_RAW_KEYS.has(k) && present(v));

  // Endpoint-protection (antivirus) detail — a product-agnostic health blob the
  // agent nests under `avDetail`. Rendered as its own card when present.
  const avDetail =
    lp.avDetail && typeof lp.avDetail === "object" && !Array.isArray(lp.avDetail)
      ? (lp.avDetail as AvDetail)
      : null;
  const avDaemon = combineDaemon(avDetail?.daemonActive ?? "", avDetail?.daemonResponsive ?? "");
  const avDefsAge = avDetail ? avDefinitionsAgeHours(avDetail) : undefined;
  const avDefsStale = avDefsAge !== undefined && avDefsAge >= AV_STALE_DEFS_HOURS;
  const avScanBad = avDetail ? AV_BAD_SCANS.has(avDetail.lastScanResult) : false;
  // Defensive: the blob crosses the wire, so never assume the array shape.
  const avDetections = Array.isArray(avDetail?.recentDetections) ? avDetail.recentDetections : [];
  const avHasThreats = avDetail
    ? avDetections.length > 0 || (avDetail.infectedCount ?? 0) > 0
    : false;

  return (
    <InfoDrawer open={deviceId !== null} onClose={onClose} title={title} widthClassName="max-w-xl">
      {loading ? (
        <div className="py-12 text-center text-neutral-500">Loading…</div>
      ) : error ? (
        <div className="text-sm text-red-600">{error}</div>
      ) : !device ? null : (
        <div className="space-y-5">
          <Section title="Overview">
            <Row label="Status">
              <Badge variant={STATUS_BADGE[device.status]}>{device.status}</Badge>
            </Row>
            <Row label="Platform">{PLATFORM_LABEL[device.platform] ?? device.platform}</Row>
            <Row label="Assigned to">
              {device.person ? (
                <Link
                  href={`/people/${device.person.id}`}
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  {device.person.fullName}
                </Link>
              ) : (
                <span className="text-neutral-400">Unassigned</span>
              )}
            </Row>
            <Row label="Asset">
              {device.asset ? (
                <Link
                  href="/assets"
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  {device.asset.name}
                </Link>
              ) : (
                "—"
              )}
            </Row>
          </Section>

          {issues.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
              <span className="font-medium">
                {issues.length} posture issue{issues.length > 1 ? "s" : ""}:
              </span>{" "}
              {issues.join(", ")}
            </div>
          )}

          <Section title="Security posture">
            {SIGNALS.map((s) => (
              <Row key={s.key} label={s.label}>
                <span className="inline-flex items-center gap-2">
                  {signalBadge(device[s.key])}
                  {s.key === "screenLock" && screenLockSuffix && (
                    <span className="text-xs font-normal text-neutral-500">{screenLockSuffix}</span>
                  )}
                  {!required.has(s.key) && <OptionalTag />}
                </span>
              </Row>
            ))}
            <Row label="Agent health">
              <Badge variant={device.agentHealthy ? "success" : "danger"}>
                {device.agentHealthy ? "healthy" : "unhealthy"}
              </Badge>
            </Row>
            {postureExtraRows.map((f) => (
              <Row key={f.key} label={f.label}>
                <span className="inline-flex items-center gap-2">
                  {signalBadge(String(lp[f.key]))}
                  {!required.has(f.key) && <OptionalTag />}
                </span>
              </Row>
            ))}
          </Section>

          {avDetail && (
            <Section title="Endpoint protection">
              <Row label="Product">
                <span className="inline-flex items-center gap-2">
                  <Badge variant={avDetail.installed ? "info" : "neutral"}>
                    {avProductLabel(avDetail.product)}
                  </Badge>
                  {!avDetail.installed && (
                    <span className="text-xs font-normal text-neutral-500">not installed</span>
                  )}
                </span>
              </Row>
              <Row label="Daemon">
                <span className="inline-flex items-center gap-2">
                  {signalBadge(avDaemon.state)}
                  {avDaemon.note && (
                    <span className="text-xs font-normal text-neutral-500">{avDaemon.note}</span>
                  )}
                </span>
              </Row>
              <Row label="Real-time protection">{signalBadge(avDetail.realTimeProtection)}</Row>
              <Row label="Definitions">
                {present(avDetail.definitionsUpdatedAt) || avDefsAge !== undefined ? (
                  <span className="inline-flex items-center gap-2">
                    <span className={avDefsStale ? "text-red-600 dark:text-red-400" : undefined}>
                      {fmtDate(avDetail.definitionsUpdatedAt)}
                    </span>
                    {avDefsAge !== undefined && (
                      <span
                        className={`text-xs font-normal ${
                          avDefsStale ? "text-red-600 dark:text-red-400" : "text-neutral-500"
                        }`}
                      >
                        {fmtAgeHours(avDefsAge)}
                      </span>
                    )}
                  </span>
                ) : (
                  "—"
                )}
              </Row>
              <Row label="Last scan">
                {present(avDetail.lastScanAt) || avDetail.lastScanResult !== "unknown" ? (
                  <span className="inline-flex items-center gap-2">
                    <span className={avScanBad ? "text-red-600 dark:text-red-400" : undefined}>
                      {fmtDate(avDetail.lastScanAt)}
                    </span>
                    <Badge
                      variant={
                        avScanBad
                          ? "danger"
                          : avDetail.lastScanResult === "clean"
                            ? "success"
                            : "neutral"
                      }
                    >
                      {avDetail.lastScanResult}
                    </Badge>
                  </span>
                ) : (
                  "—"
                )}
              </Row>

              {avHasThreats && (
                <div className="mt-3 rounded-lg border border-red-300 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950">
                  <div className="text-sm font-semibold text-red-700 dark:text-red-300">
                    {avDetail.infectedCount > 0
                      ? `${avDetail.infectedCount} threat${
                          avDetail.infectedCount === 1 ? "" : "s"
                        } detected`
                      : "Threats detected"}
                  </div>
                  {avDetections.length > 0 && (
                    <ul className="mt-2 space-y-2">
                      {avDetections.map((det, i) => (
                        <li
                          key={`${det.signature}:${det.detectedAt}:${i}`}
                          className="border-t border-red-200/70 pt-2 first:border-t-0 first:pt-0 dark:border-red-900/60"
                        >
                          <div className="text-xs font-medium text-red-700 dark:text-red-300">
                            {det.signature || "Unknown signature"}
                          </div>
                          <div
                            className="break-all font-mono text-xs text-red-600 dark:text-red-400"
                            title={det.file}
                          >
                            {truncateMiddle(det.file)}
                          </div>
                          <div className="text-xs text-red-500 dark:text-red-400/80">
                            {fmtDate(det.detectedAt)}
                            {det.source ? ` · ${det.source}` : ""}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </Section>
          )}

          {hardwareRows.length > 0 && (
            <Section title="Hardware">
              {hardwareRows.map((f) => (
                <Row key={f.key} label={f.label}>
                  {f.fmt ? f.fmt(lp[f.key]) : fmtRawValue(lp[f.key])}
                </Row>
              ))}
            </Section>
          )}

          <Section title="Operating system">
            <Row label="Version">{device.osVersion || "—"}</Row>
            {osRows.map((f) => (
              <Row key={f.key} label={f.label}>
                {f.fmt ? f.fmt(lp[f.key]) : fmtRawValue(lp[f.key])}
              </Row>
            ))}
          </Section>

          <Section title="Agent & enrollment">
            <Row label="Agent version">{device.agentVersion || "—"}</Row>
            <Row label="Hardware ID">
              <span className="font-mono text-xs">{device.hardwareId || "—"}</span>
            </Row>
            <Row label="Enrolled">{fmtDate(device.enrolledAt)}</Row>
            <Row label="Last seen">{fmtDate(device.lastSeenAt)}</Row>
            <Row label="Last posture">{fmtDate(device.lastPostureAt)}</Row>
            <Row label="Check-in interval">{fmtInterval(device.checkInIntervalSeconds)}</Row>
          </Section>

          {rawEntries.length > 0 && (
            <Section title="Reported details">
              {rawEntries.map(([k, v]) => (
                <Row key={k} label={humanizeKey(k)}>
                  {fmtRawValue(v)}
                </Row>
              ))}
            </Section>
          )}

          {history.length > 0 && (
            <Section title="Recent check-ins">
              <ul className="space-y-2">
                {history.map((h) => (
                  <li key={h.id} className="flex items-center justify-between gap-3 text-xs">
                    <span className="text-neutral-500">{fmtDate(h.collectedAt)}</span>
                    <span className="flex flex-wrap justify-end gap-1">
                      {signalBadge(h.diskEncryption)}
                      {signalBadge(h.firewall)}
                      {signalBadge(h.screenLock)}
                      {signalBadge(h.antivirus)}
                    </span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {canManage && device.status !== "revoked" && (
            <div className="border-t border-neutral-200 pt-4 dark:border-neutral-800">
              <Button variant="secondary" onClick={revoke} disabled={busy}>
                {busy ? "Revoking…" : "Revoke device"}
              </Button>
            </div>
          )}
        </div>
      )}
    </InfoDrawer>
  );
}
