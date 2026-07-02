import type { FrameworkDef } from "./index.js";

/**
 * PCI DSS v4.0.1 control catalog — curated at the granularity a QSA/ISA
 * actually walks through during an assessment, mirroring the GDPR pack's
 * curation philosophy rather than mechanically expanding every defined
 * approach requirement and testing procedure (~250+ items in the full
 * standard).
 *
 * Structure: the six PCI SSC goals are the categories; the 12 principal
 * requirements sit inside them; entries are the sub-requirements an
 * assessor samples first (identifier style "3.5.1", matching the
 * standard's numbering so ROC/SAQ workpapers line up).
 *
 * Curation notes:
 *   • The recurring "x.1.1 / x.1.2 — processes documented, roles assigned"
 *     governance pair that opens every principal requirement is captured
 *     once via 12.1.x rather than duplicated twelve times.
 *   • Future-dated v4.0 requirements that became mandatory with v4.0.1
 *     (e.g. 6.4.3, 11.6.1, 12.3.1) are included; niche appendix items are
 *     not.
 *
 * PCI SSC's standard text is copyrighted — every description below is an
 * original paraphrase of the requirement's intent, not the standard's
 * wording.
 */
export const PCI_DSS_4_FRAMEWORK: FrameworkDef = {
  name: "PCI DSS",
  version: "4.0.1",
  description:
    "Payment Card Industry Data Security Standard v4.0.1 — technical and operational requirements for all entities that store, process or transmit cardholder data or that could affect the security of the cardholder data environment (CDE).",
  frameworkType: "pci_dss_4",
  requirements: [
    // ── Goal 1: Build and Maintain Secure Networks and Systems ─────────
    // Requirement 1 — Install and maintain network security controls
    {
      identifier: "1.2.1",
      title: "Configuration standards for network security controls",
      category: "Build and Maintain Secure Networks and Systems",
      description:
        "Define, implement and maintain configuration standards for the rulesets of firewalls, routers, cloud security groups and other network security controls (NSCs).",
      evidenceGuidance:
        "NSC configuration standard; sampled firewall/security-group configs matching the standard; IaC modules encoding the ruleset baseline.",
    },
    {
      identifier: "1.2.3",
      title: "Current network diagram",
      category: "Build and Maintain Secure Networks and Systems",
      description:
        "Maintain an accurate network diagram showing all connections between the cardholder data environment and other networks, including wireless, and keep it updated as the environment changes.",
      evidenceGuidance:
        "Network diagram with last-reviewed date; change-management step requiring diagram updates.",
    },
    {
      identifier: "1.2.4",
      title: "Current cardholder data-flow diagram",
      category: "Build and Maintain Secure Networks and Systems",
      description:
        "Maintain an accurate data-flow diagram showing every path account data takes across systems and networks — capture, authorization, settlement, storage and any transfers to third parties.",
      evidenceGuidance:
        "Data-flow diagram(s) covering all payment channels; annual review sign-off.",
    },
    {
      identifier: "1.2.7",
      title: "Periodic review of NSC configurations",
      category: "Build and Maintain Secure Networks and Systems",
      description:
        "Review network security control rulesets at least once every six months to confirm each rule is still needed, correctly scoped and supported by a business justification.",
      evidenceGuidance:
        "Semi-annual ruleset review reports; tickets removing stale or over-broad rules.",
    },
    {
      identifier: "1.3.1",
      title: "Inbound traffic to the CDE restricted",
      category: "Build and Maintain Secure Networks and Systems",
      description:
        "Restrict inbound traffic into the cardholder data environment to only that which is necessary, denying everything else by default.",
      evidenceGuidance:
        "Firewall/security-group rules for CDE ingress with justifications; default-deny evidence.",
    },
    {
      identifier: "1.4.1",
      title: "Controls between trusted and untrusted networks",
      category: "Build and Maintain Secure Networks and Systems",
      description:
        "Implement network security controls between trusted and untrusted networks so that traffic crossing the boundary is mediated and restricted to authorized communications.",
      evidenceGuidance:
        "Perimeter/DMZ architecture evidence; rules limiting untrusted-network traffic to defined destinations.",
    },
    {
      identifier: "1.5.1",
      title: "Security controls on devices that bridge networks",
      category: "Build and Maintain Secure Networks and Systems",
      description:
        "Enforce security controls (such as host firewalls) on any computing device that connects to both untrusted networks and the CDE — including employee laptops — so the device cannot become an unmanaged bridge.",
      evidenceGuidance:
        "Endpoint firewall/MDM policy for devices with CDE access; posture checks preventing non-compliant devices from connecting.",
    },
    // Requirement 2 — Apply secure configurations to all system components
    {
      identifier: "2.2.1",
      title: "Secure configuration standards",
      category: "Build and Maintain Secure Networks and Systems",
      description:
        "Develop and apply hardening/configuration standards for all system component types, consistent with accepted industry baselines, and keep them updated as new vulnerabilities emerge.",
      evidenceGuidance:
        "Hardening standards (e.g. CIS-aligned) per platform; configuration-compliance scan results.",
    },
    {
      identifier: "2.2.2",
      title: "Vendor default accounts managed",
      category: "Build and Maintain Secure Networks and Systems",
      description:
        "Change or disable vendor-supplied default accounts and passwords before a system is deployed into the environment.",
      evidenceGuidance:
        "Build checklist step; scan results confirming no default credentials on in-scope components.",
    },
    {
      identifier: "2.2.4",
      title: "Only necessary services and functions enabled",
      category: "Build and Maintain Secure Networks and Systems",
      description:
        "Remove or disable all services, protocols, daemons and functions that are not required for a component's role.",
      evidenceGuidance:
        "Baseline images with minimal footprints; periodic port/service scans reconciled against approved lists.",
    },
    {
      identifier: "2.2.7",
      title: "Non-console administrative access encrypted",
      category: "Build and Maintain Secure Networks and Systems",
      description:
        "Encrypt all non-console administrative access (SSH, RDP, web consoles) using strong cryptography so credentials and sessions cannot be intercepted.",
      evidenceGuidance:
        "Config evidence disabling cleartext admin protocols (telnet, HTTP); TLS/SSH settings on management interfaces.",
    },
    {
      identifier: "2.3.1",
      title: "Wireless vendor defaults changed",
      category: "Build and Maintain Secure Networks and Systems",
      description:
        "For wireless environments connected to the CDE or transmitting account data, change all wireless vendor defaults at installation — keys, passwords, SNMP strings and firmware accounts.",
      evidenceGuidance:
        "Wireless controller configuration evidence; procedure for key rotation when personnel with key knowledge leave.",
    },

    // ── Goal 2: Protect Account Data ────────────────────────────────────
    // Requirement 3 — Protect stored account data
    {
      identifier: "3.2.1",
      title: "Account data storage minimized",
      category: "Protect Account Data",
      description:
        "Keep account data storage to the minimum required, enforce documented retention periods tied to business/legal need, and securely delete or render data unrecoverable when retention expires — verified at least every three months.",
      evidenceGuidance:
        "Data-retention policy for account data; quarterly purge job results; data-discovery scans confirming no out-of-policy storage.",
    },
    {
      identifier: "3.3.1",
      title: "Sensitive authentication data not retained",
      category: "Protect Account Data",
      description:
        "Do not retain sensitive authentication data (full track data, card verification codes, PIN blocks) after authorization, even encrypted; issuers may retain it only with documented business justification.",
      evidenceGuidance:
        "SAD-discovery scan results across databases, logs and memory dumps; application design evidence showing SAD is discarded post-authorization.",
    },
    {
      identifier: "3.4.1",
      title: "PAN masked when displayed",
      category: "Protect Account Data",
      description:
        "Mask the primary account number when displayed (at most BIN and last four digits visible) so that only personnel with a documented business need can see more.",
      evidenceGuidance:
        "UI screenshots of masked PAN; role list approved to view full PAN with justification.",
    },
    {
      identifier: "3.5.1",
      title: "PAN rendered unreadable in storage",
      category: "Protect Account Data",
      description:
        "Render PAN unreadable wherever it is stored using one-way keyed hashes, truncation, index tokens, or strong cryptography with associated key management.",
      evidenceGuidance:
        "Data-store inventory noting the protection method per location; encryption/tokenization configuration evidence.",
    },
    {
      identifier: "3.6.1",
      title: "Cryptographic key protection",
      category: "Protect Account Data",
      description:
        "Protect the keys used to secure stored account data with documented procedures, restricting access to the fewest custodians necessary and storing keys in the fewest possible locations and strongest available forms (e.g. HSM, key-encrypting keys).",
      evidenceGuidance:
        "Key-management policy; HSM/KMS configuration; key-custodian list and signed acknowledgements.",
    },
    {
      identifier: "3.7.1",
      title: "Key lifecycle management",
      category: "Protect Account Data",
      description:
        "Implement full key-lifecycle procedures for account-data keys — strong generation, secure distribution and storage, defined cryptoperiods with rotation, and retirement or replacement when a key is weakened or suspected compromised.",
      evidenceGuidance:
        "Key inventory with generation dates and cryptoperiods; rotation records; documented retirement/compromise procedure.",
    },
    // Requirement 4 — Protect cardholder data in transit over open, public networks
    {
      identifier: "4.2.1",
      title: "Strong cryptography for PAN in transit",
      category: "Protect Account Data",
      description:
        "Use strong cryptography and accepted protocols (with trusted keys and certificates) to protect PAN during transmission over open, public networks, and reject fallback to insecure protocol versions.",
      evidenceGuidance:
        "TLS scan results for public endpoints; certificate validity checks; configuration disabling weak protocols/ciphers.",
    },
    {
      identifier: "4.2.1.1",
      title: "Inventory of trusted keys and certificates",
      category: "Protect Account Data",
      description:
        "Maintain an inventory of the entity's trusted keys and certificates used to protect PAN in transit, keeping it current so expiring or untrusted certificates are caught before they fail.",
      evidenceGuidance:
        "Certificate inventory with expiry monitoring; alerts for approaching expiration.",
    },
    {
      identifier: "4.2.2",
      title: "PAN secured in end-user messaging",
      category: "Protect Account Data",
      description:
        "Secure PAN with strong cryptography whenever it is sent via end-user messaging technologies (email, chat, SMS) — or prohibit those channels for PAN entirely.",
      evidenceGuidance:
        "DLP rules blocking unencrypted PAN in email/chat; policy prohibiting PAN over messaging; secure-transfer alternative.",
    },

    // ── Goal 3: Maintain a Vulnerability Management Program ─────────────
    // Requirement 5 — Protect all systems and networks from malicious software
    {
      identifier: "5.2.1",
      title: "Anti-malware deployed on in-scope systems",
      category: "Maintain a Vulnerability Management Program",
      description:
        "Deploy an anti-malware solution on all system components except those documented, via periodic evaluation, as not at risk from malware.",
      evidenceGuidance:
        "Anti-malware coverage report reconciled against the asset inventory; documented not-at-risk system list with evaluation dates.",
    },
    {
      identifier: "5.3.1",
      title: "Anti-malware kept current",
      category: "Maintain a Vulnerability Management Program",
      description:
        "Keep the anti-malware solution current via automatic updates so it can detect the latest known threats.",
      evidenceGuidance: "Console evidence of signature/engine currency across the fleet.",
    },
    {
      identifier: "5.3.2",
      title: "Anti-malware scanning or continuous analysis",
      category: "Maintain a Vulnerability Management Program",
      description:
        "Run periodic and on-access scans, or perform continuous behavioural analysis, on protected systems so active malware is detected in time to respond.",
      evidenceGuidance: "Scan schedules and results; EDR continuous-monitoring configuration.",
    },
    {
      identifier: "5.4.1",
      title: "Anti-phishing protection",
      category: "Maintain a Vulnerability Management Program",
      description:
        "Implement processes and automated mechanisms that detect and protect personnel against phishing attacks (e.g. mail authentication, link/attachment scanning).",
      evidenceGuidance:
        "Email-security gateway configuration (DMARC/SPF/DKIM, link rewriting); phishing-simulation and reporting metrics.",
    },
    // Requirement 6 — Develop and maintain secure systems and software
    {
      identifier: "6.2.1",
      title: "Secure software development",
      category: "Maintain a Vulnerability Management Program",
      description:
        "Develop bespoke and custom software following a documented secure development lifecycle that addresses security throughout — requirements, design, coding, testing and release.",
      evidenceGuidance:
        "SDLC policy; evidence of security activities in recent releases (threat models, code review, security tests).",
    },
    {
      identifier: "6.2.4",
      title: "Protection against common software attacks",
      category: "Maintain a Vulnerability Management Program",
      description:
        "Apply engineering techniques that prevent or mitigate common attack classes in bespoke and custom software — injection, broken access control, cryptographic misuse, business-logic abuse and similar.",
      evidenceGuidance:
        "Secure-coding standard mapped to attack classes; SAST/DAST findings and remediation; framework-level defences (parameterized queries, output encoding).",
    },
    {
      identifier: "6.3.1",
      title: "Vulnerabilities identified and risk-ranked",
      category: "Maintain a Vulnerability Management Program",
      description:
        "Identify new security vulnerabilities using industry sources and assign each a risk ranking (including a 'critical/high' tier) that drives remediation priority for the environment.",
      evidenceGuidance:
        "Vulnerability-intelligence sources; documented ranking methodology; triage records showing rankings applied.",
    },
    {
      identifier: "6.3.2",
      title: "Inventory of software and components",
      category: "Maintain a Vulnerability Management Program",
      description:
        "Maintain an inventory of bespoke and custom software and the third-party components embedded in it, so vulnerability management can cover the full supply chain.",
      evidenceGuidance: "Software inventory / SBOMs; dependency-scanning tooling wired into CI.",
    },
    {
      identifier: "6.3.3",
      title: "Security patches installed",
      category: "Maintain a Vulnerability Management Program",
      description:
        "Install applicable security patches: critical/high-ranked patches within one month of release, and all others within a timeframe set by the entity's risk analysis.",
      evidenceGuidance:
        "Patch-compliance reports with age-of-patch metrics; exception records for deferred patches.",
    },
    {
      identifier: "6.4.2",
      title: "Automated protection for public-facing web applications",
      category: "Maintain a Vulnerability Management Program",
      description:
        "Deploy an automated technical solution (such as a web application firewall) in front of public-facing web applications that continually detects and blocks web-based attacks.",
      evidenceGuidance:
        "WAF deployment evidence in blocking mode; rule update process; blocked-attack reports.",
    },
    {
      identifier: "6.4.3",
      title: "Payment page scripts managed",
      category: "Maintain a Vulnerability Management Program",
      description:
        "Manage all scripts loaded and executed on consumer payment pages: authorize each script, assure its integrity, and keep an inventory with written justification for why each is necessary.",
      evidenceGuidance:
        "Payment-page script inventory with justifications; CSP/SRI or script-monitoring tooling enforcing integrity.",
    },
    {
      identifier: "6.5.1",
      title: "Change management for production systems",
      category: "Maintain a Vulnerability Management Program",
      description:
        "Follow documented change-control procedures for all changes to system components in the production environment — reason and description, security-impact assessment, approval, and rollback provisions.",
      evidenceGuidance:
        "Change tickets sampled against the procedure; emergency-change path with retrospective approval.",
    },

    // ── Goal 4: Implement Strong Access Control Measures ────────────────
    // Requirement 7 — Restrict access by business need to know
    {
      identifier: "7.2.1",
      title: "Access control model defined",
      category: "Implement Strong Access Control Measures",
      description:
        "Define an access control model that grants access to system components and data based on job classification and function, covering all users and defaulting to deny.",
      evidenceGuidance: "RBAC matrix mapping roles to CDE systems and data; access-control policy.",
    },
    {
      identifier: "7.2.2",
      title: "Least-privilege assignment",
      category: "Implement Strong Access Control Measures",
      description:
        "Assign users — including privileged users — only the least privileges necessary for their job responsibilities, with documented approval by authorized personnel.",
      evidenceGuidance:
        "Access-request approvals; comparison of granted entitlements vs role matrix.",
    },
    {
      identifier: "7.2.4",
      title: "Periodic review of user accounts and privileges",
      category: "Implement Strong Access Control Measures",
      description:
        "Review all user accounts and related access privileges (including third-party and vendor accounts) at least once every six months, remediating inappropriate access and obtaining management acknowledgement.",
      evidenceGuidance:
        "Semi-annual access-review campaigns with reviewer sign-off and revocation tickets.",
    },
    {
      identifier: "7.2.5",
      title: "System and application account privileges limited",
      category: "Implement Strong Access Control Measures",
      description:
        "Assign and manage all application and system (service) accounts with the least privileges needed for the component's operation, and review their access periodically.",
      evidenceGuidance:
        "Service-account inventory with owners and scoped permissions; periodic review evidence.",
    },
    {
      identifier: "7.3.3",
      title: "Access control system defaults to deny",
      category: "Implement Strong Access Control Measures",
      description:
        "Configure the access control system(s) governing in-scope components to enforce assigned permissions and to deny all access not explicitly allowed.",
      evidenceGuidance: "Default-deny configuration evidence in IAM/directory systems.",
    },
    // Requirement 8 — Identify users and authenticate access
    {
      identifier: "8.2.1",
      title: "Unique IDs for all users",
      category: "Implement Strong Access Control Measures",
      description:
        "Assign every user a unique identifier before granting access to system components or cardholder data, so actions are traceable to individuals.",
      evidenceGuidance:
        "Directory export showing unique accounts; controls preventing shared logins on in-scope systems.",
    },
    {
      identifier: "8.2.2",
      title: "Shared accounts only by documented exception",
      category: "Implement Strong Access Control Measures",
      description:
        "Use group, shared or generic accounts only when necessary on an exception basis, with documented approval, time limitation and individual accountability preserved.",
      evidenceGuidance:
        "Exception register for shared accounts; compensating traceability (session recording, checkout vaults).",
    },
    {
      identifier: "8.2.5",
      title: "Access revoked immediately on termination",
      category: "Implement Strong Access Control Measures",
      description: "Revoke access for terminated users immediately across all in-scope systems.",
      evidenceGuidance:
        "Offboarding SLA evidence comparing termination time to revocation time; leaver reconciliation reports.",
    },
    {
      identifier: "8.3.4",
      title: "Invalid authentication attempts limited",
      category: "Implement Strong Access Control Measures",
      description:
        "Lock a user's account after no more than ten consecutive invalid authentication attempts, keeping it locked for at least 30 minutes or until identity is verified.",
      evidenceGuidance: "IdP/OS lockout policy configuration; lockout event samples.",
    },
    {
      identifier: "8.3.6",
      title: "Password strength",
      category: "Implement Strong Access Control Measures",
      description:
        "Where passwords are used as an authentication factor, require at least 12 characters (or the system maximum if lower, minimum 8) containing both letters and numbers.",
      evidenceGuidance: "Password-policy configuration on IdP and local systems.",
    },
    {
      identifier: "8.4.1",
      title: "MFA for administrative access",
      category: "Implement Strong Access Control Measures",
      description:
        "Require multi-factor authentication for all non-console administrative access into the CDE.",
      evidenceGuidance: "MFA enforcement policy for admin roles; authentication logs showing MFA.",
    },
    {
      identifier: "8.4.2",
      title: "MFA for all access into the CDE",
      category: "Implement Strong Access Control Measures",
      description:
        "Require multi-factor authentication for all non-console access into the cardholder data environment, not just administrative access.",
      evidenceGuidance:
        "MFA coverage evidence for every CDE access path; conditional-access policies.",
    },
    {
      identifier: "8.4.3",
      title: "MFA for remote network access",
      category: "Implement Strong Access Control Measures",
      description:
        "Require multi-factor authentication for all remote access originating outside the entity's network — workforce, administrators and third parties alike.",
      evidenceGuidance: "VPN/ZTNA MFA configuration; third-party remote-access records.",
    },
    {
      identifier: "8.6.2",
      title: "No hard-coded credentials",
      category: "Implement Strong Access Control Measures",
      description:
        "Do not hard-code passwords or passphrases for application and system accounts into scripts, configuration files or bespoke source code.",
      evidenceGuidance:
        "Secret-scanning results on repositories; use of a secrets manager for service credentials.",
    },
    // Requirement 9 — Restrict physical access to cardholder data
    {
      identifier: "9.2.1",
      title: "Physical access controls for CDE facilities",
      category: "Implement Strong Access Control Measures",
      description:
        "Use appropriate facility entry controls to restrict and monitor physical access to systems in the cardholder data environment.",
      evidenceGuidance:
        "Badge/lock systems on rooms housing CDE systems; for cloud infrastructure, provider attestations (SOC 2 / ISO) covering data-center controls.",
    },
    {
      identifier: "9.3.1",
      title: "Personnel physical access authorized",
      category: "Implement Strong Access Control Measures",
      description:
        "Implement procedures to authorize, badge and manage physical access for personnel to sensitive areas, revoking access immediately upon termination.",
      evidenceGuidance:
        "Badge issuance/termination records; access-list reviews for sensitive areas.",
    },
    {
      identifier: "9.3.2",
      title: "Visitor authorization and escort",
      category: "Implement Strong Access Control Measures",
      description:
        "Authorize visitors before entry to areas where cardholder data is processed or maintained, escort them at all times, and identify them visibly with an expiring badge.",
      evidenceGuidance: "Visitor procedure; visitor log with authorization and escort details.",
    },
    {
      identifier: "9.4.1",
      title: "Media with cardholder data physically secured",
      category: "Implement Strong Access Control Measures",
      description:
        "Physically secure all media containing cardholder data, including backups stored offsite, with periodic review of the offsite location's security.",
      evidenceGuidance: "Media storage inventory; offsite-storage contract and review records.",
    },
    {
      identifier: "9.4.6",
      title: "Media destroyed when no longer needed",
      category: "Implement Strong Access Control Measures",
      description:
        "Destroy hard-copy materials containing cardholder data when no longer needed (cross-cut shred, incinerate or pulp) and render electronic media unrecoverable before disposal.",
      evidenceGuidance:
        "Destruction procedure; certificates of destruction; secure disposal bins evidence.",
    },
    {
      identifier: "9.5.1",
      title: "Point-of-interaction device protection",
      category: "Implement Strong Access Control Measures",
      description:
        "Protect payment-capture (POI) devices from tampering, substitution and skimming: maintain a device inventory, periodically inspect devices, and train personnel to recognise tampering and verify third-party technicians.",
      evidenceGuidance:
        "POI device inventory with locations and serials; inspection logs; anti-tampering training records.",
    },

    // ── Goal 5: Regularly Monitor and Test Networks ─────────────────────
    // Requirement 10 — Log and monitor all access
    {
      identifier: "10.2.1",
      title: "Audit logs capture required events",
      category: "Regularly Monitor and Test Networks",
      description:
        "Enable audit logging on all in-scope system components, capturing at minimum: individual access to cardholder data, administrative actions, access to logs, invalid access attempts, authentication-mechanism changes, log initialization/stops, and creation or deletion of system objects.",
      evidenceGuidance:
        "Logging configuration per component type mapped to the required event classes; sample log records.",
    },
    {
      identifier: "10.2.2",
      title: "Audit log record content",
      category: "Regularly Monitor and Test Networks",
      description:
        "Record enough detail in each audit event to reconstruct it — user, event type, date/time, success or failure, origination, and the identity of the affected data, component or resource.",
      evidenceGuidance: "Log-schema documentation; sampled records showing all fields.",
    },
    {
      identifier: "10.3.2",
      title: "Audit logs protected from modification",
      category: "Regularly Monitor and Test Networks",
      description:
        "Protect audit log files from unauthorized modification, and back them up promptly to a centralized server or media that is difficult to alter.",
      evidenceGuidance:
        "Central log platform with append-only/immutability settings; restricted write permissions on log paths.",
    },
    {
      identifier: "10.4.1",
      title: "Daily review of security-relevant logs",
      category: "Regularly Monitor and Test Networks",
      description:
        "Review security events and logs of critical and security-function components at least daily, using automated mechanisms, and follow up identified anomalies and exceptions.",
      evidenceGuidance:
        "SIEM alerting rules and daily-review workflow; triage records for exceptions.",
    },
    {
      identifier: "10.5.1",
      title: "Audit log retention",
      category: "Regularly Monitor and Test Networks",
      description:
        "Retain audit log history for at least 12 months, with the most recent three months immediately available for analysis.",
      evidenceGuidance:
        "Retention configuration on the log platform; storage-tier evidence for hot vs archive logs.",
    },
    {
      identifier: "10.6.1",
      title: "Synchronized time",
      category: "Regularly Monitor and Test Networks",
      description:
        "Synchronize system clocks using time-synchronization technology from designated, protected time sources so events can be correlated across components.",
      evidenceGuidance: "NTP configuration and source hierarchy; drift-monitoring evidence.",
    },
    {
      identifier: "10.7.2",
      title: "Failures of critical security control systems detected",
      category: "Regularly Monitor and Test Networks",
      description:
        "Detect, alert on and promptly address failures of critical security control systems — NSCs, IDS/IPS, anti-malware, access controls, audit logging and segmentation controls — restoring the function and assessing the security impact of the outage.",
      evidenceGuidance:
        "Health monitoring/alerting for security tooling; incident records for control failures with root-cause and duration.",
    },
    // Requirement 11 — Test security of systems and networks regularly
    {
      identifier: "11.3.1",
      title: "Internal vulnerability scans",
      category: "Regularly Monitor and Test Networks",
      description:
        "Perform internal vulnerability scans at least once every three months and after significant changes, using authenticated scanning where feasible, and resolve critical- and high-risk findings with rescans confirming remediation.",
      evidenceGuidance:
        "Quarterly internal scan reports; remediation tickets and passing rescans; authenticated-scan configuration.",
    },
    {
      identifier: "11.3.2",
      title: "External vulnerability scans (ASV)",
      category: "Regularly Monitor and Test Networks",
      description:
        "Perform external vulnerability scans at least once every three months via a PCI SSC Approved Scanning Vendor, remediating failures and rescanning until a passing result is achieved.",
      evidenceGuidance: "Quarterly ASV scan attestations covering the full external footprint.",
    },
    {
      identifier: "11.4.2",
      title: "Internal penetration testing",
      category: "Regularly Monitor and Test Networks",
      description:
        "Perform internal penetration testing at least annually and after significant infrastructure or application changes, following the entity's defined methodology, and correct exploitable findings.",
      evidenceGuidance:
        "Internal pentest report with scope and methodology; remediation evidence and retest results.",
    },
    {
      identifier: "11.4.3",
      title: "External penetration testing",
      category: "Regularly Monitor and Test Networks",
      description:
        "Perform external penetration testing at least annually and after significant changes, by a qualified internal resource or third party, covering the network and application layers of the CDE perimeter.",
      evidenceGuidance:
        "External pentest report; tester qualifications; remediation and retest records.",
    },
    {
      identifier: "11.4.5",
      title: "Segmentation controls tested",
      category: "Regularly Monitor and Test Networks",
      description:
        "Where segmentation is used to reduce PCI DSS scope, test the segmentation controls at least annually (every six months for service providers) to confirm out-of-scope networks truly cannot reach the CDE.",
      evidenceGuidance:
        "Segmentation test report enumerating tested paths; remediation of any leakage found.",
    },
    {
      identifier: "11.5.1",
      title: "Intrusion detection/prevention",
      category: "Regularly Monitor and Test Networks",
      description:
        "Use intrusion-detection or intrusion-prevention techniques to detect or block network intrusions at the CDE perimeter and at critical points inside it, keeping engines and signatures current.",
      evidenceGuidance:
        "IDS/IPS placement diagram; alerting integration; signature-update evidence.",
    },
    {
      identifier: "11.5.2",
      title: "Change-detection on critical files",
      category: "Regularly Monitor and Test Networks",
      description:
        "Deploy a change-detection mechanism (such as file-integrity monitoring) that alerts on unauthorized modification of critical system files, configuration files and content files, comparing at least weekly.",
      evidenceGuidance: "FIM tool coverage and baseline; alert samples with investigation records.",
    },
    {
      identifier: "11.6.1",
      title: "Payment page tamper detection",
      category: "Regularly Monitor and Test Networks",
      description:
        "Deploy a mechanism that detects and alerts on unauthorized changes to the HTTP headers and active content of payment pages as received by the consumer browser, evaluating at least weekly or at a risk-justified frequency.",
      evidenceGuidance:
        "Payment-page monitoring tooling (CSP violation reporting, synthetic checks); alert-response records.",
    },

    // ── Goal 6: Maintain an Information Security Policy ─────────────────
    // Requirement 12 — Support information security with policies and programs
    {
      identifier: "12.1.1",
      title: "Information security policy established",
      category: "Maintain an Information Security Policy",
      description:
        "Establish, publish and disseminate an overall information security policy, known to all relevant personnel and vendors, that directs the entity's PCI DSS program.",
      evidenceGuidance:
        "Approved security policy; distribution/acknowledgement records for workforce and relevant third parties.",
    },
    {
      identifier: "12.1.2",
      title: "Security policy reviewed annually",
      category: "Maintain an Information Security Policy",
      description:
        "Review the information security policy at least once every 12 months and update it when the business or risk environment changes.",
      evidenceGuidance: "Policy review log with dates, reviewers and change summaries.",
    },
    {
      identifier: "12.3.1",
      title: "Targeted risk analyses for flexible-frequency controls",
      category: "Maintain an Information Security Policy",
      description:
        "Perform a documented, targeted risk analysis for each PCI DSS requirement that allows the entity to choose how frequently a control is performed, revisiting each analysis at least annually.",
      evidenceGuidance:
        "TRA register listing every flexible-frequency control with the chosen cadence and justification; annual refresh records.",
    },
    {
      identifier: "12.5.2",
      title: "PCI DSS scope documented and confirmed",
      category: "Maintain an Information Security Policy",
      description:
        "Document and confirm the accuracy of PCI DSS scope at least annually and upon significant change — identifying all data flows, system components, segmentation controls and third-party connections that are in scope.",
      evidenceGuidance:
        "Annual scoping exercise output; data-discovery results validating no account data outside the documented CDE.",
    },
    {
      identifier: "12.6.1",
      title: "Security awareness program",
      category: "Maintain an Information Security Policy",
      description:
        "Implement a formal security awareness program that makes all personnel aware of the information security policy, their role in protecting cardholder data, and current threats.",
      evidenceGuidance:
        "Awareness program charter and materials; annual review of content against the current threat landscape.",
    },
    {
      identifier: "12.6.3",
      title: "Security training on hire and annually",
      category: "Maintain an Information Security Policy",
      description:
        "Train personnel upon hire and at least annually, with acknowledgement of the security policy, including awareness of threats that can affect the CDE such as phishing and social engineering.",
      evidenceGuidance:
        "Training completion records with dates; signed policy acknowledgements; phishing-awareness module content.",
    },
    {
      identifier: "12.7.1",
      title: "Personnel screening",
      category: "Maintain an Information Security Policy",
      description:
        "Screen personnel prior to hire, within the constraints of local law, for roles with access to the CDE, to reduce insider risk.",
      evidenceGuidance: "Background-check records (or evidence of screening) for CDE-access roles.",
    },
    {
      identifier: "12.8.1",
      title: "Inventory of third-party service providers",
      category: "Maintain an Information Security Policy",
      description:
        "Maintain a list of all third-party service providers (TPSPs) with which account data is shared or that could affect the security of the CDE, including a description of each service.",
      evidenceGuidance: "TPSP register with services and data shared; review cadence.",
    },
    {
      identifier: "12.8.2",
      title: "Written agreements with TPSPs",
      category: "Maintain an Information Security Policy",
      description:
        "Maintain written agreements with each TPSP that include acknowledgement of the TPSP's responsibility for the security of the account data it possesses or could affect.",
      evidenceGuidance:
        "Executed agreements with responsibility acknowledgements for every listed TPSP.",
    },
    {
      identifier: "12.8.4",
      title: "TPSP compliance monitored",
      category: "Maintain an Information Security Policy",
      description:
        "Monitor each TPSP's PCI DSS compliance status at least once every 12 months, and understand which requirements each TPSP covers versus those the entity must meet itself.",
      evidenceGuidance:
        "Annual AOC/attestation collection per TPSP; responsibility matrix distinguishing TPSP vs entity obligations.",
    },
    {
      identifier: "12.10.1",
      title: "Incident response plan",
      category: "Maintain an Information Security Policy",
      description:
        "Maintain an incident response plan, ready to activate immediately upon suspected or confirmed compromise, covering roles, communication and payment-brand/legal notification requirements, containment, and business continuity.",
      evidenceGuidance:
        "IR plan document naming responders and brand notification steps; contact rosters kept current.",
    },
    {
      identifier: "12.10.2",
      title: "Incident response plan tested",
      category: "Maintain an Information Security Policy",
      description:
        "Review and test the incident response plan at least once every 12 months — including all elements listed in the plan — and update it with lessons learned.",
      evidenceGuidance:
        "Annual tabletop or live exercise report; plan revisions traced to findings.",
    },
  ],
};
