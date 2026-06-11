/**
 * Canonical catalog of evaluable device-posture signals — the single web-side
 * source for the device drawer and the Settings "Evaluated posture signals"
 * card. Keys mirror the server's `EVALUABLE_POSTURE_SIGNALS`
 * (apps/api/src/modules/devices/service.ts) and the
 * `TenantSettings.devicePostureRequiredSignals` default; keep them in sync.
 */

// Core signals are first-class `Device` columns (read from `device[key]`).
export const CORE_SIGNALS = [
  { key: "diskEncryption", label: "Disk encryption", platforms: "" },
  { key: "firewall", label: "Host firewall", platforms: "" },
  { key: "screenLock", label: "Screen lock", platforms: "" },
  { key: "antivirus", label: "Antivirus / EDR", platforms: "" },
] as const;

// Extended signals ride in the check-in raw blob (`device.latestPosture[key]`).
export const EXTENDED_SIGNALS = [
  { key: "autoUpdate", label: "Automatic updates", platforms: "" },
  { key: "mdmEnrolled", label: "MDM managed", platforms: "" },
  { key: "gatekeeper", label: "Gatekeeper", platforms: "macOS" },
  { key: "sip", label: "System Integrity Protection", platforms: "macOS" },
] as const;

export const ALL_POSTURE_SIGNALS = [...CORE_SIGNALS, ...EXTENDED_SIGNALS];

// Default evaluated set when a tenant hasn't customised it: the four core
// signals (matches the server default).
export const DEFAULT_REQUIRED_SIGNALS: string[] = CORE_SIGNALS.map((s) => s.key);
