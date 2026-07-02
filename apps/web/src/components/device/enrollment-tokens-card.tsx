"use client";

/**
 * Admin card for device enrollment tokens (Devices page, `assets:write`).
 *
 * Enrollment tokens are the mass-deploy / MDM path: an admin mints a
 * short-lived, consumable token and bakes it into the agent rollout. The
 * server stores only the token's hash, so the raw value is displayed
 * exactly once right after minting — closing the dialog discards it
 * forever (revoke + re-mint to recover).
 */

import { useCallback, useEffect, useState } from "react";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
} from "@/components/ui/table";
import {
  apiClient,
  type DeviceEnrollmentToken,
  type DeviceEnrollmentTokenStatus,
  type MintedDeviceEnrollmentToken,
} from "@/lib/api-client";

const STATUS_BADGE: Record<DeviceEnrollmentTokenStatus, BadgeVariant> = {
  active: "success",
  consumed: "neutral",
  revoked: "danger",
  expired: "warning",
};

const EXPIRY_OPTIONS = [
  { value: "1", label: "1 hour" },
  { value: "8", label: "8 hours" },
  { value: "24", label: "24 hours" },
  { value: "72", label: "3 days" },
  { value: "168", label: "7 days" },
  { value: "720", label: "30 days" },
];

const MAX_USES_OPTIONS = [
  { value: "1", label: "Single use" },
  { value: "10", label: "10 devices" },
  { value: "50", label: "50 devices" },
  { value: "100", label: "100 devices" },
  { value: "500", label: "500 devices" },
  { value: "1000", label: "1000 devices" },
];

function fmtDate(s: string | null | undefined): string {
  if (!s) return "—";
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

/** The stored status lags reality for expiry; compute it for display. */
function effectiveStatus(t: DeviceEnrollmentToken): DeviceEnrollmentTokenStatus {
  if (t.status === "active" && new Date(t.expiresAt).getTime() < Date.now()) return "expired";
  return t.status;
}

export function EnrollmentTokensCard() {
  const [tokens, setTokens] = useState<DeviceEnrollmentToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Mint dialog state. `minted` set = show-once view of the raw token.
  const [mintOpen, setMintOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [maxUses, setMaxUses] = useState("1");
  const [expiresInHours, setExpiresInHours] = useState("24");
  const [minting, setMinting] = useState(false);
  const [mintError, setMintError] = useState("");
  const [minted, setMinted] = useState<MintedDeviceEnrollmentToken | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.listDeviceEnrollmentTokens();
      setTokens(res.data.items);
    } catch (err) {
      setError((err as Error)?.message || "Failed to load enrollment tokens");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function openMint() {
    setLabel("");
    setMaxUses("1");
    setExpiresInHours("24");
    setMintError("");
    setMinted(null);
    setCopied(false);
    setMintOpen(true);
  }

  function closeMint() {
    setMintOpen(false);
    // The raw token lives only in this dialog; refresh the list after
    // a successful mint so the new row shows up.
    if (minted) void load();
    setMinted(null);
  }

  async function mint() {
    setMinting(true);
    setMintError("");
    try {
      const res = await apiClient.createDeviceEnrollmentToken({
        label: label.trim() || undefined,
        maxUses: Number(maxUses),
        expiresInHours: Number(expiresInHours),
      });
      setMinted(res.data);
    } catch (err) {
      setMintError((err as Error)?.message || "Failed to mint token");
    } finally {
      setMinting(false);
    }
  }

  async function copyToken() {
    if (!minted) return;
    try {
      await navigator.clipboard.writeText(minted.token);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (permissions/insecure context) — the token
      // is still selectable in the code block below.
    }
  }

  async function revoke(id: string) {
    if (!confirm("Revoke this enrollment token? Agents can no longer enroll with it.")) return;
    try {
      await apiClient.revokeDeviceEnrollmentToken(id);
      void load();
    } catch (err) {
      setError((err as Error)?.message || "Failed to revoke token");
    }
  }

  return (
    <Card padding="md">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
            Enrollment tokens
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            Short-lived tokens for bulk-deploying the device agent via MDM or install scripts. The
            token value is shown once at creation; revoke it to invalidate a rollout.
          </p>
        </div>
        <Button size="sm" onClick={openMint}>
          Mint token
        </Button>
      </div>

      {error && <div className="mb-3 text-sm text-red-600">{error}</div>}

      {loading ? (
        <div className="py-8 text-center text-sm text-neutral-500">Loading…</div>
      ) : tokens.length === 0 ? (
        <div className="py-8 text-center text-sm text-neutral-500">
          No enrollment tokens yet. Mint one to bulk-deploy the device agent.
        </div>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Label</TableHeader>
              <TableHeader>Status</TableHeader>
              <TableHeader>Uses</TableHeader>
              <TableHeader>Expires</TableHeader>
              <TableHeader>Created</TableHeader>
              <TableHeader> </TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {tokens.map((t) => {
              const status = effectiveStatus(t);
              return (
                <TableRow key={t.id}>
                  <TableCell>
                    <span className="text-sm text-neutral-900 dark:text-neutral-100">
                      {t.label || <span className="text-neutral-400">Untitled</span>}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_BADGE[status]}>{status}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-neutral-500">
                    {t.useCount} / {t.maxUses}
                  </TableCell>
                  <TableCell className="text-xs text-neutral-500">{fmtDate(t.expiresAt)}</TableCell>
                  <TableCell className="text-xs text-neutral-500">{fmtDate(t.createdAt)}</TableCell>
                  <TableCell>
                    {status === "active" && (
                      <Button size="sm" variant="secondary" onClick={() => void revoke(t.id)}>
                        Revoke
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      <Modal
        open={mintOpen}
        onClose={closeMint}
        title={minted ? "Enrollment token created" : "Mint enrollment token"}
        description={
          minted
            ? undefined
            : "The agent presents this token once to enroll a device. Scope it tightly."
        }
        size="sm"
      >
        {minted ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-700/60 dark:bg-amber-950/30 dark:text-amber-200">
              This token is shown only once. Copy it now — it cannot be retrieved later.
            </div>
            <code className="block break-all rounded-lg bg-neutral-100 px-3 py-2 font-mono text-xs text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200">
              {minted.token}
            </code>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {minted.label ? `${minted.label} · ` : ""}
              {minted.maxUses} use{minted.maxUses !== 1 ? "s" : ""} · expires{" "}
              {fmtDate(minted.expiresAt)}
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" size="sm" onClick={closeMint}>
                Done
              </Button>
              <Button size="sm" onClick={() => void copyToken()}>
                {copied ? "Copied" : "Copy token"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Input
              id="token-label"
              label="Label (optional)"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Q3 laptop rollout"
              error={mintError}
            />
            <Select
              id="token-max-uses"
              label="Maximum enrollments"
              options={MAX_USES_OPTIONS}
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
            />
            <Select
              id="token-expiry"
              label="Expires in"
              options={EXPIRY_OPTIONS}
              value={expiresInHours}
              onChange={(e) => setExpiresInHours(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <Button variant="secondary" size="sm" onClick={closeMint}>
                Cancel
              </Button>
              <Button size="sm" onClick={() => void mint()} loading={minting}>
                Mint token
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </Card>
  );
}
