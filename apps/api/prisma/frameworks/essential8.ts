import type { FrameworkDef } from "./index.js";

/**
 * Essential Eight (ACSC) — Maturity Model
 * Source: Australian Cyber Security Centre, Essential Eight Maturity Model
 *   (cyber.gov.au/resources-business-and-government/essential-cyber-security/essential-eight)
 *
 * The Essential Eight is a prioritised set of mitigation strategies. The
 * Maturity Model defines three levels (ML1, ML2, ML3) describing the
 * adversary tradecraft each level is intended to mitigate:
 *
 *   ML1 — opportunistic adversaries using commodity tooling (baseline).
 *   ML2 — adversaries willing to invest more time + effort and use modest
 *         tradecraft to bypass controls.
 *   ML3 — adaptive, well-resourced adversaries focused on specific targets.
 *
 * Identifier scheme: `E8-<STRATEGY>-ML<n>` where STRATEGY is a stable short
 * code (e.g. `MFA`, `APP_CONTROL`) and `n` ∈ {1, 2, 3}. This keeps IDs short,
 * URL-safe, and stable across ACSC revisions while still allowing the
 * description to evolve.
 *
 * Descriptions intentionally capture *all three pillars* the ACSC asks
 * auditors to evaluate at each level: scope, control behaviour, and the
 * specific configurations expected. Evidence guidance lists concrete
 * artifacts an assessor would request to substantiate the level.
 */
export const ESSENTIAL8_FRAMEWORK: FrameworkDef = {
  name: "Essential Eight",
  version: "Nov 2023",
  description:
    "ACSC Essential Eight mitigation strategies (Australia). Eight prioritised cyber mitigation strategies with a three-level maturity model (ML1–ML3) for hardening Microsoft Windows-based, internet-connected networks.",
  frameworkType: "essential8",
  requirements: [
    // ── 1. Application control ────────────────────────────────────────────
    {
      identifier: "E8-APP_CONTROL-ML1",
      title: "Application control on workstations (user profiles & temp folders)",
      category: "Application control",
      maturityLevel: "ml1",
      description:
        "Application control is implemented on workstations to restrict the execution of executables, software libraries, scripts, installers, compiled HTML, HTML applications and control panel applets to an organisation-approved set within standard user profiles and temporary folders used by the operating system, web browsers and email clients. Microsoft's recommended block rules are implemented to prevent vulnerable trusted applications from being abused by malicious actors.",
      evidenceGuidance:
        "Application control configuration (e.g. AppLocker / WDAC policy XML); list of allowed executables/scripts/installers and the authorised path or publisher rules; coverage report showing all in-scope workstations are enrolled; evidence Microsoft block rules are deployed; sample blocked-execution events from event logs (Event ID 8004/8007 for AppLocker).",
    },
    {
      identifier: "E8-APP_CONTROL-ML2",
      title: "Application control on workstations and internet-facing servers (all locations)",
      category: "Application control",
      maturityLevel: "ml2",
      description:
        "Application control is implemented on workstations and internet-facing servers and applies to all locations other than user profiles and temporary folders. Microsoft's recommended block rules are deployed and allowed and blocked execution events are centrally logged, retained for at least one year, and protected from unauthorised modification and deletion.",
      evidenceGuidance:
        "Coverage report including internet-facing servers; centralised log destination and retention policy (≥12 months); WORM/role-based access controls protecting the log store; sample of allowed and blocked execution events forwarded from a workstation and a server.",
    },
    {
      identifier: "E8-APP_CONTROL-ML3",
      title: "Application control on workstations and all servers, with annual rule review",
      category: "Application control",
      maturityLevel: "ml3",
      description:
        "Application control is implemented on workstations and all servers and restricts the execution of drivers to an organisation-approved set. Microsoft's vulnerable driver blocklist is implemented. Application control rulesets are validated on an annual or more frequent basis and allowed/blocked execution events are centrally logged, retained, and monitored. Cyber security events are analysed in a timely manner to identify cyber security incidents.",
      evidenceGuidance:
        "Driver allowlist + Microsoft vulnerable driver blocklist deployed; annual ruleset review minutes / change tickets; SIEM rule that alerts on blocked-execution patterns; incident response tickets linked to alerts; evidence of timely analysis SLAs.",
    },

    // ── 2. Patch applications ─────────────────────────────────────────────
    {
      identifier: "E8-PATCH_APPS-ML1",
      title: "Patch applications: 48 hours for internet-facing, 1 month otherwise",
      category: "Patch applications",
      maturityLevel: "ml1",
      description:
        "Patches, updates or other vendor mitigations for vulnerabilities in internet-facing services are applied within 48 hours of release when an exploit exists, or within two weeks otherwise. Patches for office productivity suites, web browsers and their extensions, email clients, PDF software and security products are applied within two weeks of release. Internet-facing services and the listed application types are scanned for missing patches at least daily and fortnightly respectively. Online services and internet-facing services no longer supported by vendors are removed.",
      evidenceGuidance:
        "Vulnerability scanner configuration showing daily scans of internet-facing assets and fortnightly scans of in-scope applications; patch deployment reports with timestamps relative to vendor release; asset inventory marking unsupported software for removal/replacement.",
    },
    {
      identifier: "E8-PATCH_APPS-ML2",
      title: "Patch applications: extended scope and weekly scanning",
      category: "Patch applications",
      maturityLevel: "ml2",
      description:
        "All ML1 requirements apply. In addition, patches for applications other than those listed at ML1 are applied within one month of release. Internet-facing services are scanned for missing patches at least daily, the ML1 application list at least weekly, and other applications at least fortnightly. Applications no longer supported by vendors are removed.",
      evidenceGuidance:
        "Expanded patch SLA covering all installed applications; weekly scan reports for ML1 apps; fortnightly scan reports for the broader application catalogue; software lifecycle policy + decommission tickets for unsupported software.",
    },
    {
      identifier: "E8-PATCH_APPS-ML3",
      title: "Patch applications: drivers and firmware in scope",
      category: "Patch applications",
      maturityLevel: "ml3",
      description:
        "All ML2 requirements apply. In addition, patches for drivers and firmware are applied within one month of release. A vulnerability disclosure policy is published. Penetration testing is performed at least annually for internet-facing services and applications.",
      evidenceGuidance:
        "Driver and firmware patch records (BIOS/UEFI, NIC, storage controllers); published vulnerability disclosure policy URL; latest annual penetration test report covering internet-facing services and applications; remediation tickets for findings.",
    },

    // ── 3. Configure Microsoft Office macro settings ──────────────────────
    {
      identifier: "E8-MACROS-ML1",
      title: "Block Office macros for users without business need",
      category: "Configure Microsoft Office macro settings",
      maturityLevel: "ml1",
      description:
        "Microsoft Office macros are disabled for users that do not have a demonstrated business requirement. Office macros in files originating from the internet are blocked. Antivirus scanning of Office macros is enabled. Office users cannot change macro security settings.",
      evidenceGuidance:
        "Group Policy / Intune configuration showing macros disabled by default; Mark-of-the-Web (MOTW) blocking policy; antivirus integration logs (AMSI); user role mapping documenting who has macros enabled; locked macro security settings.",
    },
    {
      identifier: "E8-MACROS-ML2",
      title: "Macros restricted to vetted use cases with central logging",
      category: "Configure Microsoft Office macro settings",
      maturityLevel: "ml2",
      description:
        "All ML1 requirements apply. Office macros are blocked from making Win32 API calls. Allowed and blocked Office macro execution events are centrally logged, retained for at least one year, and protected from unauthorised modification and deletion.",
      evidenceGuidance:
        "Policy disabling Win32 API access from Office macros; central logging configuration and 12-month retention; sample blocked Win32 API call events; access controls protecting log integrity.",
    },
    {
      identifier: "E8-MACROS-ML3",
      title: "Only signed macros from trusted publishers, monitored",
      category: "Configure Microsoft Office macro settings",
      maturityLevel: "ml3",
      description:
        "All ML2 requirements apply. Only Office macros running from within a sandboxed environment, a Trusted Location, or that are digitally signed by a trusted publisher are allowed. Trusted Location and trusted publisher lists are validated annually. Office macro security settings cannot be changed by users. Allowed and blocked macro execution events are centrally logged, retained and monitored.",
      evidenceGuidance:
        "List of trusted publishers and Trusted Locations with annual review records; sandbox configuration for runtime macros; SIEM alerts for unsigned macro attempts and incident tickets.",
    },

    // ── 4. User application hardening ─────────────────────────────────────
    {
      identifier: "E8-APP_HARDENING-ML1",
      title: "Browser hardening: block Java, ads, IE11; lock settings",
      category: "User application hardening",
      maturityLevel: "ml1",
      description:
        "Web browsers do not process Java from the internet. Web browsers do not process web advertisements from the internet. Internet Explorer 11 is disabled or removed. Web browser security settings cannot be changed by users.",
      evidenceGuidance:
        "Group Policy or browser ADMX template settings disabling Java plugins; ad blocking configuration (e.g. uBlock policy / DNS-based blocking); IE11 disabled via Feature on Demand or Group Policy; locked browser settings verified on test workstation.",
    },
    {
      identifier: "E8-APP_HARDENING-ML2",
      title: "ASR rules, PowerShell logging, Office hardening",
      category: "User application hardening",
      maturityLevel: "ml2",
      description:
        "All ML1 requirements apply. Microsoft Office is blocked from creating child processes, executable content and injecting code into other processes. Office is configured to prevent activation of OLE packages. Office and PDF software security settings cannot be changed by users. PowerShell is configured to use Constrained Language Mode. Blocked PowerShell script executions are centrally logged, retained for at least one year, and protected from unauthorised modification.",
      evidenceGuidance:
        "Microsoft Defender ASR rules deployed (GUIDs documented); PowerShell module/script-block logging configuration; Constrained Language Mode policy; central log destination and retention; sample blocked execution events.",
    },
    {
      identifier: "E8-APP_HARDENING-ML3",
      title: "Application Control + .NET hardening + monitoring",
      category: "User application hardening",
      maturityLevel: "ml3",
      description:
        "All ML2 requirements apply. PowerShell is configured to use Constrained Language Mode and logging is monitored for malicious activity. Internet Explorer 11 is removed. .NET Framework 3.5 (including 2.0 and 3.0) is disabled or removed. Allowed and blocked PowerShell script execution events are centrally logged, retained and monitored. Cyber security events are analysed in a timely manner to identify cyber security incidents.",
      evidenceGuidance:
        "Removal evidence for IE11 and .NET 3.5; SIEM detection rules for malicious PowerShell patterns; alert triage records and linked incident tickets demonstrating timely analysis.",
    },

    // ── 5. Restrict administrative privileges ─────────────────────────────
    {
      identifier: "E8-PRIV_ACCESS-ML1",
      title:
        "Validated admin requests; segregated admin accounts; no email/web from admin accounts",
      category: "Restrict administrative privileges",
      maturityLevel: "ml1",
      description:
        "Requests for privileged access to systems, applications and data repositories are validated when first requested. Privileged accounts (excluding privileged service accounts) are prevented from accessing the internet, email and web services. Privileged users use separate privileged and unprivileged operating environments. Unprivileged accounts cannot logon to privileged operating environments and privileged accounts (excluding local administrator accounts) cannot logon to unprivileged operating environments.",
      evidenceGuidance:
        "Access request workflow with approver records; account schema documenting separate admin / standard accounts; web/email blocking policy applied to admin accounts; jump-host or PAW configuration; logon restriction policy and review evidence.",
    },
    {
      identifier: "E8-PRIV_ACCESS-ML2",
      title: "Privileged access reviewed; admin events centrally logged and JIT",
      category: "Restrict administrative privileges",
      maturityLevel: "ml2",
      description:
        "All ML1 requirements apply. Privileged access to systems, applications and data repositories is automatically disabled after 12 months unless revalidated, and after 45 days of inactivity. Privileged accounts explicitly authorised to access online services are restricted to only those required for users to undertake their duties. Privileged operating environments are not virtualised within unprivileged operating environments. Administrative activities are conducted through jump servers. Credentials for break glass accounts, local administrator accounts and service accounts are long, unique, unpredictable and managed. Privileged access events and account changes are centrally logged, retained for at least one year and protected.",
      evidenceGuidance:
        "Identity governance reports showing 12-month revalidation and 45-day inactivity disable; jump server architecture diagram; PAM vault inventory of break-glass / local admin / service account credentials with rotation cadence; centralised admin event log and 12-month retention.",
    },
    {
      identifier: "E8-PRIV_ACCESS-ML3",
      title: "Just-in-time privileged access with monitoring",
      category: "Restrict administrative privileges",
      maturityLevel: "ml3",
      description:
        "All ML2 requirements apply. Just-in-time administration is used for administering systems and applications. Memory integrity functionality is enabled. Local Security Authority protection functionality is enabled. Credential Guard functionality is enabled. Hypervisor Code Integrity functionality is enabled. Privileged access events are centrally logged, retained, monitored and analysed for malicious activity.",
      evidenceGuidance:
        "JIT admin tooling configuration (e.g. Azure PIM, CyberArk JIT) with sample request approvals; Group Policy enabling Memory Integrity / LSA / Credential Guard / HVCI; SIEM detections + incident tickets for privileged anomalies.",
    },

    // ── 6. Patch operating systems ────────────────────────────────────────
    {
      identifier: "E8-PATCH_OS-ML1",
      title: "Patch internet-facing OS within 48h; workstations/servers within 1 month",
      category: "Patch operating systems",
      maturityLevel: "ml1",
      description:
        "Patches, updates or other vendor mitigations for vulnerabilities in operating systems of internet-facing services are applied within 48 hours of release when an exploit exists, or within two weeks otherwise. Patches for operating systems of workstations, non-internet-facing servers and non-internet-facing network devices are applied within one month of release. Operating systems no longer supported by vendors are replaced. Internet-facing services are scanned at least daily and other operating systems at least fortnightly for missing patches.",
      evidenceGuidance:
        "Patch management dashboard showing SLA compliance per asset class; vulnerability scanner schedule; lifecycle plan for unsupported OS replacement; sample patch deployment records.",
    },
    {
      identifier: "E8-PATCH_OS-ML2",
      title: "Patch all OS within 2 weeks; weekly workstation scans",
      category: "Patch operating systems",
      maturityLevel: "ml2",
      description:
        "All ML1 requirements apply. In addition, patches for operating systems of workstations, non-internet-facing servers and network devices are applied within two weeks of release. Operating systems are scanned for missing patches at least daily for internet-facing services and weekly for other systems. The latest release, or the previous release, of operating systems is used.",
      evidenceGuidance:
        "Tightened patch SLA documentation; weekly vulnerability scan reports for internal estate; OS version inventory showing N or N-1 versions in use.",
    },
    {
      identifier: "E8-PATCH_OS-ML3",
      title: "Only latest OS used; drivers/firmware patched; daily scans",
      category: "Patch operating systems",
      maturityLevel: "ml3",
      description:
        "All ML2 requirements apply. Only the latest release of operating systems are used. Patches for drivers and firmware are applied within two weeks of release, or within 48 hours when an exploit exists. Operating systems are scanned for missing patches daily.",
      evidenceGuidance:
        "Asset inventory confirming all OS at latest version; driver/firmware patch tracker; daily vulnerability scan dashboard.",
    },

    // ── 7. Multi-factor authentication ────────────────────────────────────
    {
      identifier: "E8-MFA-ML1",
      title: "MFA for users on internet-facing services and customer-facing services",
      category: "Multi-factor authentication",
      maturityLevel: "ml1",
      description:
        "Multi-factor authentication is used by an organisation's users if they authenticate to their organisation's internet-facing services. Multi-factor authentication is used by an organisation's users if they authenticate to third-party internet-facing services that process, store or communicate their organisation's sensitive data. Multi-factor authentication (where available) is used by an organisation's users if they authenticate to third-party internet-facing services that process, store or communicate their organisation's non-sensitive data. Multi-factor authentication is used to authenticate customers of online customer services to their organisation's internet-facing services that process, store or communicate sensitive data.",
      evidenceGuidance:
        "MFA enrolment report for internet-facing services and SSO; vendor list classifying third-party services by data sensitivity with MFA status; customer authentication flow documentation.",
    },
    {
      identifier: "E8-MFA-ML2",
      title: "Phishing-resistant MFA + privileged users + central logging",
      category: "Multi-factor authentication",
      maturityLevel: "ml2",
      description:
        "All ML1 requirements apply. Multi-factor authentication is used to authenticate privileged users of systems. Multi-factor authentication uses either: something users have and something users know, or something users have that is unlocked by something users know or are. Successful and unsuccessful multi-factor authentication events are centrally logged, retained for at least one year and protected from unauthorised modification and deletion.",
      evidenceGuidance:
        "MFA factor inventory documenting authenticator types meeting NIST AAL2 equivalents; admin enrolment evidence; central authentication log + retention; sample success/failure events.",
    },
    {
      identifier: "E8-MFA-ML3",
      title: "Phishing-resistant MFA for all important data accesses",
      category: "Multi-factor authentication",
      maturityLevel: "ml3",
      description:
        "All ML2 requirements apply. Multi-factor authentication is used to authenticate users accessing important data repositories. Multi-factor authentication is verifier impersonation resistant and uses either: something users have and something users know, or something users have that is unlocked by something users know or are. Multi-factor authentication events are centrally logged, retained, and monitored, and cyber security events are analysed in a timely manner.",
      evidenceGuidance:
        "List of designated important data repositories and MFA enforcement evidence; FIDO2/PIV/WebAuthn deployment showing phishing-resistant authenticators; SIEM detections for anomalous MFA events and incident tickets.",
    },

    // ── 8. Regular backups ────────────────────────────────────────────────
    {
      identifier: "E8-BACKUPS-ML1",
      title: "Backups: aligned to BC requirements; restoration tested",
      category: "Regular backups",
      maturityLevel: "ml1",
      description:
        "Backups of important data, software and configuration settings are performed and retained in accordance with business continuity requirements. Restoration of systems, software and important data from backups is tested in a coordinated manner as part of disaster recovery exercises. Unprivileged accounts cannot access backups belonging to other accounts, nor their own backups. Unprivileged accounts are prevented from modifying or deleting backups.",
      evidenceGuidance:
        "Backup policy aligned to RPO/RTO; backup job reports; DR exercise plan and after-action report; backup repository ACLs preventing unprivileged write/delete; restoration test evidence.",
    },
    {
      identifier: "E8-BACKUPS-ML2",
      title: "Privileged accounts cannot modify or delete backups during retention",
      category: "Regular backups",
      maturityLevel: "ml2",
      description:
        "All ML1 requirements apply. Privileged accounts (excluding backup administrators) cannot access backups belonging to other accounts, nor their own backups. Privileged accounts (excluding backup administrators) are prevented from modifying or deleting backups during their retention period.",
      evidenceGuidance:
        "Backup IAM model documenting backup-admin role separation; immutability / object-lock configuration on backup storage; access reviews of backup permissions.",
    },
    {
      identifier: "E8-BACKUPS-ML3",
      title: "Immutable, segmented backups protected from any tampering",
      category: "Regular backups",
      maturityLevel: "ml3",
      description:
        "All ML2 requirements apply. Backup administrator accounts are prevented from modifying and deleting backups during their retention period. Backup administrator accounts are prevented from accessing backups belonging to other accounts. Backups are stored in an immutable manner and segregated from production environments.",
      evidenceGuidance:
        "Immutable storage configuration (e.g. S3 Object Lock in compliance mode, Veeam hardened repo, tape vault); network segmentation diagram showing isolated backup network; quarterly tamper-test report.",
    },
  ],
};
