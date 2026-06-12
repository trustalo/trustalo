import type { Manifest } from "../types.js";

/**
 * Endpoint device-agent manifest.
 *
 * Unlike the other connectors in this package, the device agent is a PUSH
 * source: a binary installed on employee computers reports posture to the
 * API on a heartbeat (see apps/device-agent + the apps/api devices module).
 * It therefore has no collector connect-modal or pull job and is
 * intentionally NOT part of the connectable `MANIFESTS` catalog in
 * index.ts — it is exported on its own instead.
 *
 * It still uses the manifest shape because it shares the connector
 * job-to-be-done: declaring, per posture signal, the framework
 * requirements that signal contributes evidence toward, so the API's
 * `resolveFrameworkRefs()` can map a device check-in to the tenant's
 * Controls. Each capability `key` is the evidence `manifestKey` a check-in
 * emits.
 *
 * Requirement identifiers are verified against the seeded SOC 2 / ISO 27001
 * catalogs in apps/api/prisma/frameworks.
 */
export const endpointAgentManifest: Manifest = {
  connector: "endpoint-agent",
  version: "1.0.0",
  displayName: "Trustalo Device Agent",
  description:
    "Endpoint posture reported by the cross-platform device agent: disk encryption, firewall, screen lock, antivirus/EDR, agent health, and OS version.",
  iconKey: "device",
  category: "endpoint",
  authType: "api_key",
  configFields: [],
  capabilities: [
    {
      key: "device.disk_encryption",
      title: "Disk encryption",
      description: "Full-disk encryption status (FileVault / BitLocker / LUKS).",
      defaultSeverity: "high",
      controlMappings: [
        { framework: "soc2", requirement: "CC6.7" },
        { framework: "soc2", requirement: "CC6.1" },
        { framework: "iso27001", requirement: "A.8.24" },
        { framework: "iso27001", requirement: "A.8.1" },
      ],
    },
    {
      key: "device.firewall",
      title: "Host firewall",
      description: "Host firewall enabled and filtering inbound connections.",
      defaultSeverity: "medium",
      controlMappings: [
        { framework: "soc2", requirement: "CC6.6" },
        { framework: "iso27001", requirement: "A.8.20" },
        { framework: "iso27001", requirement: "A.8.1" },
      ],
    },
    {
      key: "device.screen_lock",
      title: "Screen lock",
      description: "Automatic screen lock requiring a password/passcode on wake.",
      defaultSeverity: "medium",
      controlMappings: [
        { framework: "soc2", requirement: "CC6.1" },
        { framework: "iso27001", requirement: "A.8.1" },
        { framework: "iso27001", requirement: "A.7.7" },
      ],
    },
    {
      key: "device.antivirus",
      title: "Antivirus / EDR",
      description: "Anti-malware / endpoint protection present and enabled.",
      defaultSeverity: "high",
      controlMappings: [
        { framework: "soc2", requirement: "CC6.8" },
        { framework: "soc2", requirement: "CC7.1" },
        { framework: "iso27001", requirement: "A.8.7" },
      ],
    },
    {
      key: "device.agent_health",
      title: "Agent health",
      description: "Device agent is installed, healthy, and reporting on schedule.",
      defaultSeverity: "medium",
      controlMappings: [
        { framework: "soc2", requirement: "CC7.1" },
        { framework: "soc2", requirement: "CC7.2" },
        { framework: "iso27001", requirement: "A.8.16" },
      ],
    },
    {
      key: "device.os_version",
      title: "Operating system version",
      description: "Reported OS name + version for patch-level / vulnerability tracking.",
      defaultSeverity: "low",
      controlMappings: [
        { framework: "soc2", requirement: "CC7.1" },
        { framework: "iso27001", requirement: "A.8.8" },
        { framework: "iso27001", requirement: "A.8.9" },
      ],
    },
  ],
};
