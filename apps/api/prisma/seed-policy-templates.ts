import type { FrameworkType, PrismaClient } from "../generated/prisma/client/index.js";

type TemplateDef = {
  slug: string;
  title: string;
  shortDescription: string;
  category: string;
  /** Empty = all frameworks */
  frameworkTypes: FrameworkType[];
  tags?: string[];
  sortOrder: number;
  contentHtml: string;
};

const PLACEHOLDER_BLOCK = `
<p><strong>Fill in the bracketed placeholders below.</strong> Replace each <code>[[LIKE_THIS]]</code> with your organization’s details.</p>
<ul>
<li><strong>[[ORGANIZATION_NAME]]</strong> — Legal entity name</li>
<li><strong>[[POLICY_OWNER_ROLE]]</strong> — Role responsible for this policy (e.g. CISO)</li>
<li><strong>[[EFFECTIVE_DATE]]</strong> — Date this version takes effect</li>
<li><strong>[[REVIEW_FREQUENCY]]</strong> — e.g. Annually / Bi-annually</li>
<li><strong>[[APPLICABILITY]]</strong> — Who and what this policy applies to</li>
<li><strong>[[CONTACT_EMAIL]]</strong> — Questions / exceptions contact</li>
</ul>
`;

function doc(title: string, body: string): string {
  return `<h1>${title}</h1>
<p><em>Version 0.1 — Draft template</em></p>
<p><strong>Organization:</strong> [[ORGANIZATION_NAME]]</p>
<p><strong>Owner:</strong> [[POLICY_OWNER_ROLE]]</p>
<p><strong>Effective:</strong> [[EFFECTIVE_DATE]] | <strong>Review:</strong> [[REVIEW_FREQUENCY]]</p>
<hr />
<h2>1. Purpose</h2>
<p>[[PURPOSE_STATEMENT]]</p>
<h2>2. Scope &amp; applicability</h2>
<p>[[APPLICABILITY]]</p>
${body}
<h2>Enforcement</h2>
<p>[[ENFORCEMENT_STATEMENT]]</p>
<h2>Related documents</h2>
<p>[[RELATED_POLICIES_OR_STANDARDS]]</p>
<h2>Contact</h2>
<p>[[CONTACT_EMAIL]]</p>
<hr />
${PLACEHOLDER_BLOCK}`;
}

export const POLICY_TEMPLATE_DEFS: TemplateDef[] = [
  {
    slug: "information-security-policy",
    title: "Information Security Policy (ISMS)",
    shortDescription:
      "Top-level commitment and objectives for ISO 27001 / SOC 2 / NIST CSF 2.0 security programs.",
    category: "Governance",
    frameworkTypes: ["iso27001", "soc2", "nist_csf_2"],
    tags: ["isms", "security-program"],
    sortOrder: 10,
    contentHtml: doc(
      "Information Security Policy",
      `
<h2>3. Policy statements</h2>
<ul>
<li>[[SECURITY_OBJECTIVES]] — Measurable objectives aligned to risk appetite</li>
<li>[[MANAGEMENT_COMMITMENT]] — Leadership commitment to the ISMS / security program</li>
<li>[[COMPLIANCE_REQUIREMENTS]] — Laws, contracts, and standards that apply</li>
</ul>
<h2>4. Roles &amp; responsibilities</h2>
<p>[[ROLES_TABLE_OR_DESCRIPTION]]</p>
`,
    ),
  },
  {
    slug: "acceptable-use-policy",
    title: "Acceptable Use Policy",
    shortDescription: "Rules for acceptable use of systems, data, and communications.",
    category: "HR & Conduct",
    frameworkTypes: ["iso27001", "soc2"],
    tags: ["aup", "employees"],
    sortOrder: 20,
    contentHtml: doc(
      "Acceptable Use Policy",
      `
<h2>3. Acceptable use</h2>
<p>[[ACCEPTABLE_USE_SUMMARY]]</p>
<h2>4. Prohibited activities</h2>
<p>[[PROHIBITED_ACTIVITIES_LIST]]</p>
<h2>5. Monitoring &amp; privacy notice</h2>
<p>[[MONITORING_DISCLOSURE]]</p>
`,
    ),
  },
  {
    slug: "access-control-policy",
    title: "Access Control Policy",
    shortDescription: "Identity, authentication, authorization, and access reviews.",
    category: "Identity & Access",
    frameworkTypes: ["iso27001", "iso27017", "soc2", "nist_csf_2", "essential8"],
    tags: ["iam", "least-privilege"],
    sortOrder: 30,
    contentHtml: doc(
      "Access Control Policy",
      `
<h2>3. Access principles</h2>
<ul>
<li>[[LEAST_PRIVILEGE_PRINCIPLE]]</li>
<li>[[SEPARATION_OF_DUTIES]]</li>
<li>[[DEFAULT_DENY]]</li>
</ul>
<h2>4. Account lifecycle</h2>
<p>[[JOINER_MOVER_LEAVER_PROCESS]]</p>
<h2>5. Privileged access</h2>
<p>[[PRIVILEGED_ACCESS_CONTROLS]]</p>
<h2>6. Access reviews</h2>
<p>[[ACCESS_REVIEW_CADENCE_AND_OWNER]]</p>
`,
    ),
  },
  {
    slug: "password-authentication-policy",
    title: "Password & Authentication Policy",
    shortDescription:
      "Password rules, MFA, and credential management. Required for Essential 8 ML1+ and NIST CSF PR.AA.",
    category: "Identity & Access",
    frameworkTypes: ["iso27001", "soc2", "essential8", "nist_csf_2"],
    tags: ["mfa", "credentials"],
    sortOrder: 40,
    contentHtml: doc(
      "Password & Authentication Policy",
      `
<h2>3. Authentication requirements</h2>
<p>[[MFA_REQUIREMENTS]]</p>
<h2>4. Password / secret requirements</h2>
<p>[[PASSWORD_RULES_OR_SSO_NOTE]]</p>
<h2>5. Service &amp; break-glass accounts</h2>
<p>[[SERVICE_ACCOUNT_RULES]]</p>
`,
    ),
  },
  {
    slug: "data-classification-handling",
    title: "Data Classification & Handling",
    shortDescription: "Classification scheme, labeling, and handling rules.",
    category: "Data Protection",
    frameworkTypes: ["iso27001", "iso27018", "soc2", "gdpr", "nist_csf_2"],
    tags: ["classification", "data"],
    sortOrder: 50,
    contentHtml: doc(
      "Data Classification & Handling Policy",
      `
<h2>3. Classification scheme</h2>
<p>[[CLASSIFICATION_LEVELS_TABLE]]</p>
<h2>4. Handling &amp; storage</h2>
<p>[[HANDLING_RULES_BY_CLASS]]</p>
<h2>5. Transmission &amp; sharing</h2>
<p>[[SHARING_AND_ENCRYPTION_RULES]]</p>
`,
    ),
  },
  {
    slug: "incident-response-policy",
    title: "Incident Response Policy",
    shortDescription:
      "Detection, reporting, containment, and lessons learned. Aligns with NIST CSF RS, GDPR Art. 33-34.",
    category: "Incident Response",
    frameworkTypes: ["iso27001", "soc2", "nist_csf_2", "gdpr"],
    tags: ["ir", "breach"],
    sortOrder: 60,
    contentHtml: doc(
      "Incident Response Policy",
      `
<h2>3. Reporting</h2>
<p>[[REPORTING_CHANNELS_AND_TIMELINES]]</p>
<h2>4. Response phases</h2>
<p>[[IR_PHASES_AND_ROLES]]</p>
<h2>5. Evidence &amp; forensics</h2>
<p>[[EVIDENCE_HANDLING]]</p>
<h2>6. External notification</h2>
<p>[[REGULATOR_CUSTOMER_NOTIFICATION_RULES]]</p>
`,
    ),
  },
  {
    slug: "business-continuity-policy",
    title: "Business Continuity Policy",
    shortDescription: "BC objectives, roles, and alignment with ISO 22301 / BIA.",
    category: "Business Continuity",
    frameworkTypes: ["iso22301", "iso27001"],
    tags: ["bcp", "resilience"],
    sortOrder: 70,
    contentHtml: doc(
      "Business Continuity Policy",
      `
<h2>3. Objectives &amp; scope</h2>
<p>[[BC_OBJECTIVES_AND_CRITICAL_SERVICES]]</p>
<h2>4. Roles</h2>
<p>[[BC_ROLES_CRISIS_TEAM]]</p>
<h2>5. Strategies</h2>
<p>[[BC_STRATEGIES_RTO_RPO_REFERENCE]]</p>
<h2>6. Exercises</h2>
<p>[[EXERCISE_CADENCE]]</p>
`,
    ),
  },
  {
    slug: "vendor-third-party-policy",
    title: "Vendor & Third-Party Risk Policy",
    shortDescription:
      "Due diligence, contracts, and ongoing monitoring of suppliers. Covers NIST CSF GV.SC and GDPR Art. 28 sub-processors.",
    category: "Vendor Management",
    frameworkTypes: ["iso27001", "soc2", "nist_csf_2", "gdpr"],
    tags: ["tprm", "supply-chain"],
    sortOrder: 80,
    contentHtml: doc(
      "Vendor & Third-Party Risk Policy",
      `
<h2>3. Risk tiers</h2>
<p>[[VENDOR_TIERING_CRITERIA]]</p>
<h2>4. Due diligence</h2>
<p>[[DD_REQUIREMENTS_BY_TIER]]</p>
<h2>5. Contractual security</h2>
<p>[[CONTRACT_SECURITY_CLAUSES]]</p>
<h2>6. Ongoing monitoring</h2>
<p>[[MONITORING_AND_OFFBOARDING]]</p>
`,
    ),
  },
  {
    slug: "remote-working-policy",
    title: "Remote Working & Endpoint Security",
    shortDescription: "Secure use of remote access, devices, and home working.",
    category: "Operations",
    frameworkTypes: ["iso27001"],
    tags: ["remote", "byod"],
    sortOrder: 90,
    contentHtml: doc(
      "Remote Working Policy",
      `
<h2>3. Remote access</h2>
<p>[[VPN_OR_ZTNA_REQUIREMENTS]]</p>
<h2>4. Endpoint requirements</h2>
<p>[[MDM_EDR_REQUIREMENTS]]</p>
<h2>5. Physical &amp; family security</h2>
<p>[[CLEAR_SCREEN_AND_HOME_OFFICE]]</p>
`,
    ),
  },
  {
    slug: "change-management-policy",
    title: "Change Management Policy",
    shortDescription:
      "Controlled changes to systems and environments (SOC 2 CC8 / ISO A.8 / NIST CSF PR.PS).",
    category: "Change Management",
    frameworkTypes: ["iso27001", "soc2", "nist_csf_2"],
    tags: ["sdlc", "changes"],
    sortOrder: 100,
    contentHtml: doc(
      "Change Management Policy",
      `
<h2>3. Change types</h2>
<p>[[CHANGE_CATEGORIES_STANDARD_NORMAL_EMERGENCY]]</p>
<h2>4. Approval workflow</h2>
<p>[[APPROVAL_MATRIX]]</p>
<h2>5. Testing &amp; rollback</h2>
<p>[[TESTING_AND_ROLLBACK_RULES]]</p>
`,
    ),
  },
  {
    slug: "logging-monitoring-policy",
    title: "Logging & Security Monitoring Policy",
    shortDescription: "What to log, retention, review, and alerting. Aligns with NIST CSF DE.CM.",
    category: "Operations",
    frameworkTypes: ["iso27001", "iso27017", "soc2", "nist_csf_2"],
    tags: ["siem", "audit-logs"],
    sortOrder: 110,
    contentHtml: doc(
      "Logging & Security Monitoring Policy",
      `
<h2>3. Logging requirements</h2>
<p>[[LOG_SOURCES_AND_FIELDS]]</p>
<h2>4. Time sync &amp; integrity</h2>
<p>[[NTP_AND_TAMPER_PROTECTION]]</p>
<h2>5. Retention</h2>
<p>[[LOG_RETENTION_PERIODS]]</p>
<h2>6. Review &amp; alerting</h2>
<p>[[REVIEW_CADENCE_AND_SOC]]</p>
`,
    ),
  },
  {
    slug: "backup-recovery-policy",
    title: "Backup & Recovery Policy",
    shortDescription:
      "Backup scope, encryption, testing, and restoration. Covers Essential 8 'Regular Backups' and NIST CSF RC.RP.",
    category: "Operations",
    frameworkTypes: ["iso27001", "essential8", "nist_csf_2", "iso22301"],
    tags: ["backup", "rto-rpo"],
    sortOrder: 120,
    contentHtml: doc(
      "Backup & Recovery Policy",
      `
<h2>3. Scope</h2>
<p>[[SYSTEMS_IN_SCOPE]]</p>
<h2>4. Frequency &amp; encryption</h2>
<p>[[BACKUP_SCHEDULE_AND_ENCRYPTION]]</p>
<h2>5. Testing</h2>
<p>[[RESTORE_TEST_CADENCE]]</p>
`,
    ),
  },
  {
    slug: "cloud-security-policy",
    title: "Cloud Security Policy",
    shortDescription: "Shared responsibility, cloud config, and supplier use (ISO 27017).",
    category: "Cloud Security",
    frameworkTypes: ["iso27017", "iso27001", "soc2"],
    tags: ["csp", "iaas-paas-saas"],
    sortOrder: 130,
    contentHtml: doc(
      "Cloud Security Policy",
      `
<h2>3. Shared responsibility</h2>
<p>[[SHARED_RESPONSIBILITY_SUMMARY]]</p>
<h2>4. Cloud account governance</h2>
<p>[[ACCOUNTS_OU_SCP_OR_EQUIVALENT]]</p>
<h2>5. Configuration baselines</h2>
<p>[[CIS_OR_ORG_BASELINES]]</p>
<h2>6. Keys &amp; secrets</h2>
<p>[[KMS_AND_SECRET_MANAGEMENT]]</p>
`,
    ),
  },
  {
    slug: "privacy-pii-public-cloud-policy",
    title: "Privacy & PII in Public Cloud",
    shortDescription: "PII processing commitments for public cloud (ISO 27018 alignment).",
    category: "Privacy",
    frameworkTypes: ["iso27018", "iso27001"],
    tags: ["pii", "privacy"],
    sortOrder: 140,
    contentHtml: doc(
      "Privacy & PII in Public Cloud Policy",
      `
<h2>3. PII categories &amp; purposes</h2>
<p>[[PII_CATEGORIES_AND_LEGAL_BASES]]</p>
<h2>4. Sub-processors</h2>
<p>[[SUBPROCESSOR_MANAGEMENT]]</p>
<h2>5. Data subject rights</h2>
<p>[[DSR_PROCESS_REFERENCE]]</p>
<h2>6. International transfers</h2>
<p>[[TRANSFER_MECHANISMS]]</p>
`,
    ),
  },
  {
    slug: "ai-governance-policy",
    title: "AI Governance & Acceptable Use Policy",
    shortDescription: "Governance for AI systems, risk, and human oversight (ISO 42001).",
    category: "AI & Automation",
    frameworkTypes: ["iso42001", "iso27001"],
    tags: ["ai-act", "governance"],
    sortOrder: 150,
    contentHtml: doc(
      "AI Governance & Acceptable Use Policy",
      `
<h2>3. Scope of AI systems</h2>
<p>[[AI_SYSTEMS_IN_SCOPE]]</p>
<h2>4. Risk &amp; impact assessment</h2>
<p>[[AI_RISK_ASSESSMENT_PROCESS]]</p>
<h2>5. Human oversight</h2>
<p>[[HUMAN_OVERSIGHT_RULES]]</p>
<h2>6. Data &amp; model governance</h2>
<p>[[TRAINING_DATA_AND_MODEL_CARDS]]</p>
<h2>7. Third-party AI services</h2>
<p>[[VENDOR_AI_REQUIREMENTS]]</p>
`,
    ),
  },
  {
    slug: "physical-security-policy",
    title: "Physical Security Policy",
    shortDescription: "Physical access, media, and environmental controls.",
    category: "Physical Security",
    frameworkTypes: ["iso27001", "soc2"],
    tags: ["datacenter", "badges"],
    sortOrder: 160,
    contentHtml: doc(
      "Physical Security Policy",
      `
<h2>3. Physical access</h2>
<p>[[PERIMETER_AND_BADGE_CONTROLS]]</p>
<h2>4. Media &amp; equipment</h2>
<p>[[MEDIA_HANDLING_AND_DESTRUCTION]]</p>
<h2>5. Visitors &amp; contractors</h2>
<p>[[VISITOR_PROCEDURES]]</p>
`,
    ),
  },
  {
    slug: "asset-management-policy",
    title: "Asset Management Policy",
    shortDescription: "Inventory, ownership, and lifecycle of information assets.",
    category: "Asset Management",
    frameworkTypes: ["iso27001", "soc2"],
    tags: ["inventory", "cmdb"],
    sortOrder: 170,
    contentHtml: doc(
      "Asset Management Policy",
      `
<h2>3. Asset inventory</h2>
<p>[[INVENTORY_PROCESS_AND_OWNER]]</p>
<h2>4. Acceptable use &amp; return</h2>
<p>[[ASSET_USE_AND_RETURN]]</p>
<h2>5. Disposal</h2>
<p>[[SANITIZATION_AND_DISPOSAL]]</p>
`,
    ),
  },
  {
    slug: "risk-management-policy",
    title: "Risk Management Policy",
    shortDescription:
      "Risk assessment cadence, treatment, and acceptance authority. Foundational for NIST CSF GV.RM and ISO 27001 Cl. 6.",
    category: "Risk Management",
    frameworkTypes: ["iso27001", "soc2", "nist_csf_2"],
    tags: ["risk-register", "treatment"],
    sortOrder: 180,
    contentHtml: doc(
      "Risk Management Policy",
      `
<h2>3. Risk methodology</h2>
<p>[[RISK_SCALE_AND_CRITERIA]]</p>
<h2>4. Treatment &amp; acceptance</h2>
<p>[[TREATMENT_OPTIONS_AND_SIGN_OFF]]</p>
<h2>5. Monitoring</h2>
<p>[[RISK_REVIEW_CADENCE]]</p>
`,
    ),
  },
  {
    slug: "secure-development-policy",
    title: "Secure Development & SDLC Policy",
    shortDescription: "Security in design, code review, testing, and dependency management.",
    category: "Operations",
    frameworkTypes: ["iso27001", "soc2"],
    tags: ["sdlc", "appsec"],
    sortOrder: 190,
    contentHtml: doc(
      "Secure Development Policy",
      `
<h2>3. Security requirements</h2>
<p>[[SEC_REQUIREMENTS_IN_DESIGN]]</p>
<h2>4. Code &amp; dependency management</h2>
<p>[[SCA_SAST_DAST_REFERENCE]]</p>
<h2>5. Environments</h2>
<p>[[ENV_SEPARATION_RULES]]</p>
`,
    ),
  },
  {
    slug: "data-retention-disposal-policy",
    title: "Data Retention & Disposal Policy",
    shortDescription:
      "Retention schedules and secure disposal. Required by GDPR Art. 5(1)(e) 'storage limitation'.",
    category: "Data Protection",
    frameworkTypes: ["soc2", "iso27001", "iso27018", "gdpr"],
    tags: ["retention", "disposal"],
    sortOrder: 200,
    contentHtml: doc(
      "Data Retention & Disposal Policy",
      `
<h2>3. Retention schedule</h2>
<p>[[RETENTION_SCHEDULE_BY_DATA_TYPE]]</p>
<h2>4. Legal holds</h2>
<p>[[LEGAL_HOLD_PROCESS]]</p>
<h2>5. Secure disposal</h2>
<p>[[DISPOSAL_METHODS]]</p>
`,
    ),
  },
  // ════════════════════════════════════════════════════════════════════
  // Essential Eight (ACSC) — six mitigation-specific templates.
  // The remaining two mitigations (MFA, Regular Backups) are covered by the
  // existing `password-authentication-policy` and `backup-recovery-policy`
  // entries which have been tagged for `essential8`.
  // ════════════════════════════════════════════════════════════════════
  {
    slug: "e8-application-control-policy",
    title: "Application Control (Allow-listing) Policy",
    shortDescription:
      "Essential 8 — Application Control. Only approved executables, scripts, installers and DLLs run on workstations and servers.",
    category: "Endpoint Security",
    frameworkTypes: ["essential8", "iso27001"],
    tags: ["e8", "allowlist", "endpoint"],
    sortOrder: 210,
    contentHtml: doc(
      "Application Control (Allow-listing) Policy",
      `
<h2>3. Allow-list scope</h2>
<p>[[IN_SCOPE_SYSTEMS]] — Workstations, servers, ephemeral build agents, container hosts. Note any explicitly excluded systems.</p>
<h2>4. Implementation</h2>
<ul>
<li>[[ENFORCEMENT_TECHNOLOGY]] — e.g. Windows Defender Application Control (WDAC), AppLocker, macOS Endpoint Security, Linux fapolicyd, container image signing (cosign).</li>
<li>[[RULESET_BASIS]] — Vendor / publisher-signed allow-list, hash-based, or path-based with mitigations.</li>
<li>[[BLOCKED_FILE_TYPES]] — Executables, software libraries, scripts (PowerShell, .py, .sh), installers, compiled HTML, HTML applications, control panel applets, drivers.</li>
</ul>
<h2>5. Maturity targets</h2>
<ul>
<li><strong>ML1</strong>: Allow-listing on workstations restricting user profiles + temp folders.</li>
<li><strong>ML2</strong>: Extends to all workstations and internet-facing servers; Microsoft recommended block rules implemented.</li>
<li><strong>ML3</strong>: All workstations and servers including SaaS production hosts; driver allow-listing; quarterly ruleset review.</li>
</ul>
<h2>6. Exceptions &amp; change process</h2>
<p>[[EXCEPTION_PROCESS]] — How developers and operators request additions; SLA; review board; revocation criteria.</p>
<h2>7. Monitoring</h2>
<p>[[BLOCKED_EXECUTION_ALERTING]] — Forward block events to the SIEM; review weekly; investigate any unexplained blocks.</p>
`,
    ),
  },
  {
    slug: "e8-patch-applications-procedure",
    title: "Patch Applications Procedure",
    shortDescription:
      "Essential 8 — Patch Applications. Vulnerability scanning and patch SLAs for internet-facing apps, productivity suites, and developer tools.",
    category: "Vulnerability Management",
    frameworkTypes: ["essential8", "iso27001", "soc2", "nist_csf_2"],
    tags: ["e8", "patching", "vulnerability"],
    sortOrder: 220,
    contentHtml: doc(
      "Patch Applications Procedure",
      `
<h2>3. Scanning cadence</h2>
<ul>
<li>[[INTERNET_FACING_SCAN_FREQUENCY]] — ML2 requires every 2 weeks; ML3 requires every 24 hours.</li>
<li>[[INTERNAL_SCAN_FREQUENCY]] — Workstations / non-internet apps. ML2 = 2 weeks, ML3 = weekly.</li>
<li>[[TOOLING]] — e.g. Tenable, Qualys, AWS Inspector, Snyk Open Source / Container, Trivy.</li>
</ul>
<h2>4. Patch SLAs (max time-to-patch)</h2>
<table border="1">
<tr><th>Severity</th><th>Internet-facing</th><th>Other systems</th></tr>
<tr><td>Critical / vulnerable to a working exploit</td><td>[[48 hours]]</td><td>[[2 weeks]]</td></tr>
<tr><td>High</td><td>[[2 weeks]]</td><td>[[1 month]]</td></tr>
<tr><td>Medium / Low</td><td>[[1 month]]</td><td>[[3 months]]</td></tr>
</table>
<h2>5. In-scope applications</h2>
<p>[[APP_INVENTORY_REFERENCE]] — Web browsers, email clients, MS Office / Google Workspace, PDF readers, conferencing apps, security products, container base images, language runtimes, CI/CD tooling, and any application processing customer data.</p>
<h2>6. Removal of unsupported software</h2>
<p>[[EOL_SOFTWARE_RULE]] — Software that has reached end-of-support is removed within [[30]] days unless an isolation-and-monitoring exception is approved.</p>
<h2>7. Reporting</h2>
<p>[[KPI_DASHBOARD]] — % patched within SLA, mean-time-to-patch, count of EOL software in production. Reviewed monthly with the security committee.</p>
`,
    ),
  },
  {
    slug: "e8-patch-operating-systems-procedure",
    title: "Patch Operating Systems Procedure",
    shortDescription:
      "Essential 8 — Patch Operating Systems. Cadence and SLAs for OS, hypervisor, network, and firmware patches.",
    category: "Vulnerability Management",
    frameworkTypes: ["essential8", "iso27001", "nist_csf_2"],
    tags: ["e8", "patching", "os"],
    sortOrder: 230,
    contentHtml: doc(
      "Patch Operating Systems Procedure",
      `
<h2>3. In-scope systems</h2>
<p>[[OS_INVENTORY]] — Workstations, servers, network devices, hypervisors, container hosts, IoT/OT, security appliances, mobile device fleet (MDM-managed).</p>
<h2>4. Scanning cadence</h2>
<ul>
<li>[[INTERNET_FACING_OS_SCAN]] — ML2 weekly; ML3 every 24 hours.</li>
<li>[[INTERNAL_OS_SCAN]] — ML2 monthly; ML3 every 2 weeks.</li>
</ul>
<h2>5. Patch SLAs</h2>
<p>Same severity tiers as the Patch Applications Procedure. Critical patches with a working exploit on internet-facing OS = [[48 hours]].</p>
<h2>6. Container images &amp; AMIs</h2>
<p>[[BASE_IMAGE_REFRESH_CADENCE]] — Re-build production container base images at least monthly; rotate AMIs quarterly; scan all images at build and at deploy.</p>
<h2>7. Unsupported OS handling</h2>
<p>[[UNSUPPORTED_OS_REMOVAL]] — End-of-support OS versions removed within [[30]] days; if isolation is required pending decommission, document via the exception process.</p>
<h2>8. Reboot &amp; maintenance windows</h2>
<p>[[REBOOT_WINDOWS]]</p>
`,
    ),
  },
  {
    slug: "e8-restrict-admin-privileges-policy",
    title: "Restrict Administrative Privileges Policy",
    shortDescription:
      "Essential 8 — Restrict Admin Privileges. Just-in-time admin, separate accounts, and validated requests.",
    category: "Identity & Access",
    frameworkTypes: ["essential8", "iso27001", "soc2", "nist_csf_2"],
    tags: ["e8", "privileged-access", "pam"],
    sortOrder: 240,
    contentHtml: doc(
      "Restrict Administrative Privileges Policy",
      `
<h2>3. Privileged account categories</h2>
<p>[[PRIV_ACCOUNT_TYPES]] — Cloud root / payer accounts, IAM administrators, production database / Kubernetes cluster admins, SaaS tenant admins, domain admins, source-code repo owners, CI/CD secret managers.</p>
<h2>4. Separate accounts &amp; environments</h2>
<ul>
<li>Privileged users hold a dedicated admin account, separate from their day-to-day account.</li>
<li>Admin accounts have no internet, email or web browsing capability (or are restricted to administrative consoles only).</li>
<li>Admin actions are performed from hardened jump hosts / privileged-access workstations.</li>
</ul>
<h2>5. Just-in-time elevation</h2>
<p>[[JIT_TOOLING]] — e.g. AWS IAM Identity Center session policies, GCP IAM conditions, Azure PIM, Teleport, Boundary, opal/granted. Default access duration: [[8 hours]].</p>
<h2>6. Approval &amp; validation</h2>
<p>[[REQUEST_APPROVAL_FLOW]] — Each privileged grant requires a request with business justification and a second-person approval. Re-validation of standing privileges at least every [[12 months]] (ML2) / [[6 months]] (ML3).</p>
<h2>7. Logging &amp; alerting</h2>
<p>[[PRIV_ACTIVITY_LOGGING]] — All privileged actions logged centrally; alerts for off-hours use, unusual source IPs, and break-glass account usage.</p>
`,
    ),
  },
  {
    slug: "e8-user-application-hardening-policy",
    title: "User Application Hardening Policy",
    shortDescription:
      "Essential 8 — User Application Hardening. Browser, PDF reader, and Office hardening configurations.",
    category: "Endpoint Security",
    frameworkTypes: ["essential8", "iso27001"],
    tags: ["e8", "hardening", "browser"],
    sortOrder: 250,
    contentHtml: doc(
      "User Application Hardening Policy",
      `
<h2>3. Web browsers</h2>
<ul>
<li>Java content blocked from executing.</li>
<li>Web ads blocked at the network or browser layer.</li>
<li>Internet Explorer 11 disabled or removed.</li>
<li>ASD-recommended security settings applied via MDM (e.g. Chrome / Edge enterprise policies).</li>
</ul>
<h2>4. Productivity suites (Office / Google Workspace)</h2>
<ul>
<li>Office files from the internet open in Protected View.</li>
<li>OLE / DDE auto-execution disabled.</li>
<li>Add-ins restricted to an approved allow-list.</li>
</ul>
<h2>5. PDF readers</h2>
<p>[[PDF_HARDENING]] — JavaScript disabled, Protected Mode enabled, attachments not allowed to open.</p>
<h2>6. Configuration management</h2>
<p>[[CONFIG_TOOLING]] — MDM (Intune / Jamf / Workspace ONE / Google Endpoint), GPO, or Ansible. Drift monitored and remediated weekly.</p>
<h2>7. Logging</h2>
<p>[[BLOCKED_CONTENT_LOGGING]] — Configuration changes and blocked-content events forwarded to the SIEM; reviewed monthly.</p>
`,
    ),
  },
  {
    slug: "e8-office-macro-settings-policy",
    title: "Configure MS Office Macro Settings Policy",
    shortDescription:
      "Essential 8 — Configure Office Macro Settings. Macros disabled by default with limited, signed exceptions.",
    category: "Endpoint Security",
    frameworkTypes: ["essential8", "iso27001"],
    tags: ["e8", "macros", "office"],
    sortOrder: 260,
    contentHtml: doc(
      "Configure MS Office Macro Settings Policy",
      `
<h2>3. Default posture</h2>
<p>Microsoft Office macros are disabled for all users that do not have a documented business requirement. Macros from the internet are blocked entirely (Mark of the Web enforced).</p>
<h2>4. Allowed macro use</h2>
<ul>
<li>Macros are only enabled for [[ROLES_OR_GROUPS]] with a documented business need.</li>
<li>Allowed macros must be digitally signed by a trusted publisher OR run only from a Trusted Location with file-system access controls.</li>
<li>Macros cannot make Win32 API calls (ML2+).</li>
</ul>
<h2>5. Antivirus scanning</h2>
<p>[[AV_INTEGRATION]] — Antivirus AMSI integration enabled to scan macros at runtime.</p>
<h2>6. Logging</h2>
<p>[[MACRO_EXECUTION_LOGS]] — Macro execution events forwarded to the SIEM; failures and blocked attempts reviewed weekly.</p>
<h2>7. Reviews</h2>
<p>[[MACRO_REVIEW_CADENCE]] — Trusted publisher list and Trusted Locations reviewed at least every [[6 months]].</p>
`,
    ),
  },

  // ════════════════════════════════════════════════════════════════════
  // NIST CSF 2.0 — four templates focused on the new GOVERN function and
  // the SaaS-relevant detection / supply chain / awareness controls.
  // ════════════════════════════════════════════════════════════════════
  {
    slug: "csf-cybersecurity-governance-policy",
    title: "Cybersecurity Governance Policy (CSF GOVERN)",
    shortDescription:
      "NIST CSF 2.0 GOVERN — strategy, roles, policies, oversight, and measurement of the cybersecurity program.",
    category: "Governance",
    frameworkTypes: ["nist_csf_2", "iso27001"],
    tags: ["csf", "govern", "strategy"],
    sortOrder: 270,
    contentHtml: doc(
      "Cybersecurity Governance Policy",
      `
<h2>3. Cybersecurity strategy &amp; mission alignment (GV.OC, GV.SF)</h2>
<p>[[CYBER_MISSION_STATEMENT]] — How cybersecurity supports the SaaS mission, customer trust commitments, and contractual obligations.</p>
<h2>4. Roles, responsibilities &amp; authorities (GV.RR)</h2>
<ul>
<li>[[BOARD_OVERSIGHT]] — Frequency of board / executive cyber updates.</li>
<li>[[CISO_AUTHORITY]] — Reporting line, budget authority, escalation path.</li>
<li>[[RACI_REFERENCE]] — Link to the program RACI matrix.</li>
</ul>
<h2>5. Risk management strategy (GV.RM)</h2>
<p>[[RISK_APPETITE_STATEMENT]] — Quantitative or qualitative thresholds; how risk is escalated.</p>
<h2>6. Cybersecurity policy framework (GV.PO)</h2>
<p>[[POLICY_HIERARCHY]] — How this policy relates to the ISMS, ancillary policies, and standards. Review cadence (annual minimum).</p>
<h2>7. Supply chain risk management (GV.SC)</h2>
<p>[[SCRM_REFERENCE]] — Link to the C-SCRM policy.</p>
<h2>8. Oversight &amp; metrics (GV.OV)</h2>
<p>[[KPI_LIST]] — Key cybersecurity outcome metrics reported to leadership (e.g. mean-time-to-patch, % MFA coverage, # high-risk findings open beyond SLA).</p>
`,
    ),
  },
  {
    slug: "csf-supply-chain-risk-management-policy",
    title: "Cybersecurity Supply Chain Risk Management (C-SCRM) Policy",
    shortDescription:
      "NIST CSF GV.SC — supplier identification, criticality, security requirements, and lifecycle controls for the SaaS supply chain.",
    category: "Vendor Management",
    frameworkTypes: ["nist_csf_2", "iso27001", "soc2"],
    tags: ["c-scrm", "supply-chain", "vendor"],
    sortOrder: 280,
    contentHtml: doc(
      "Cybersecurity Supply Chain Risk Management Policy",
      `
<h2>3. Supplier scope &amp; criticality (GV.SC-04)</h2>
<p>[[SUPPLIER_TIERS]] — Tier 1 (process customer data, host production), Tier 2 (corporate SaaS), Tier 3 (low-impact). Each SaaS sub-processor is at minimum Tier 1.</p>
<h2>4. Security &amp; resilience requirements (GV.SC-05, GV.SC-09)</h2>
<ul>
<li>Tier 1: SOC 2 Type II / ISO 27001 / equivalent attestation, signed DPA where applicable, BC/DR plan evidence, annual reassessment.</li>
<li>Open-source dependencies: SCA scanning, license compliance, signed-release verification where supported.</li>
<li>SBOM requirements: [[SBOM_REQUIREMENT]] (e.g. CycloneDX from Tier 1 suppliers on request).</li>
</ul>
<h2>5. Onboarding due diligence (GV.SC-06)</h2>
<p>[[ONBOARDING_PROCESS]] — Security questionnaire, evidence review, contract review, sign-off matrix.</p>
<h2>6. Continuous monitoring (GV.SC-07)</h2>
<p>[[ONGOING_MONITORING]] — Annual reassessment for Tier 1; monitoring for breach disclosures, attestation expiry, and material organizational change.</p>
<h2>7. Incidents &amp; response (GV.SC-08, GV.SC-10)</h2>
<p>[[SUPPLIER_INCIDENT_PLAYBOOK]] — Notification SLAs from suppliers; how supplier-originating incidents are integrated into the IR plan; lessons-learned distribution.</p>
<h2>8. Off-boarding</h2>
<p>[[OFFBOARDING_CHECKLIST]] — Account closure, key revocation, certified data return / destruction.</p>
`,
    ),
  },
  {
    slug: "csf-security-awareness-training-policy",
    title: "Security Awareness & Training Policy",
    shortDescription:
      "NIST CSF PR.AT — onboarding training, role-based training, phishing simulations, and effectiveness measurement.",
    category: "HR & Conduct",
    frameworkTypes: ["nist_csf_2", "iso27001", "soc2", "gdpr"],
    tags: ["csf", "training", "awareness"],
    sortOrder: 290,
    contentHtml: doc(
      "Security Awareness & Training Policy",
      `
<h2>3. Audience &amp; cadence</h2>
<ul>
<li>All personnel (incl. contractors with system access): security awareness training within [[14 days]] of onboarding and annually thereafter.</li>
<li>Engineers: secure-development training (e.g. OWASP Top 10) annually.</li>
<li>Privileged users / SREs: privileged-access risk training annually.</li>
<li>Customer-support: data-handling and DSAR-handling training; refresher every [[12 months]].</li>
<li>Executives / board: annual cyber-risk briefing.</li>
</ul>
<h2>4. Content scope</h2>
<p>[[TOPICS]] — Phishing &amp; social engineering, secure data handling, password &amp; MFA, incident reporting, GDPR principles, AI acceptable use, mobile / remote working.</p>
<h2>5. Phishing simulations</h2>
<p>[[PHISHING_PROGRAM]] — Cadence ([[quarterly]]), platform, targeted-population coverage, escalating-difficulty scenarios, follow-up training for repeat clickers.</p>
<h2>6. Records &amp; effectiveness</h2>
<p>[[RECORDS]] — Completion records retained for [[3 years]]; pass thresholds; failure-to-complete escalation; effectiveness measured via simulation results and incident reports.</p>
<h2>7. Roles &amp; responsibilities</h2>
<p>[[OWNER_RACI]] — Security team owns content and metrics; People team enforces completion via the LMS.</p>
`,
    ),
  },
  {
    slug: "csf-continuous-monitoring-procedure",
    title: "Continuous Monitoring & Threat Detection Procedure",
    shortDescription:
      "NIST CSF DE.CM / DE.AE — what is monitored, by whom, what triggers an alert, and how anomalies are analysed.",
    category: "Operations",
    frameworkTypes: ["nist_csf_2", "iso27001", "soc2"],
    tags: ["csf", "soc", "monitoring"],
    sortOrder: 300,
    contentHtml: doc(
      "Continuous Monitoring & Threat Detection Procedure",
      `
<h2>3. Monitored telemetry sources (DE.CM)</h2>
<ul>
<li>Cloud control plane (CloudTrail / Cloud Audit Logs / Activity Logs)</li>
<li>Identity provider (login, MFA, role assumption, SSO failures)</li>
<li>Application access logs and API audit logs</li>
<li>Endpoint EDR telemetry</li>
<li>Network: VPC flow logs, WAF, DDoS, DNS queries</li>
<li>Database / data-store audit logs</li>
<li>Container runtime &amp; Kubernetes audit logs</li>
<li>SaaS supplier telemetry where available (GitHub audit, Slack audit, etc.)</li>
</ul>
<h2>4. Detection-engineering catalogue (DE.AE)</h2>
<p>[[DETECTION_CATALOG_REFERENCE]] — Detections mapped to MITRE ATT&amp;CK; each detection has owner, severity, runbook link, and a tested response procedure.</p>
<h2>5. Triage &amp; analysis</h2>
<ul>
<li>[[ON_CALL_ROTATION]] — Who triages, response SLA per severity.</li>
<li>[[ANOMALY_ANALYSIS]] — How anomalies are correlated across telemetry, false-positive feedback loop, escalation path to IR.</li>
</ul>
<h2>6. Asset &amp; vulnerability monitoring</h2>
<p>[[VULN_FEEDS]] — CVE/CISA-KEV monitoring, prioritisation rules, integration with the patch SLA from the Patch Applications Procedure.</p>
<h2>7. Metrics</h2>
<p>[[KPIS]] — MTTD (detect), MTTR (respond), false-positive rate, % of detections with runbooks, % of MITRE techniques covered.</p>
`,
    ),
  },

  // ════════════════════════════════════════════════════════════════════
  // GDPR — nine SaaS-focused templates covering the obligations a SaaS
  // controller / processor will be asked to evidence in a DPIA, audit, or
  // customer security review.
  // ════════════════════════════════════════════════════════════════════
  {
    slug: "gdpr-privacy-policy",
    title: "Privacy & Data Protection Policy",
    shortDescription:
      "Internal GDPR program policy — principles, lawful basis, accountability, roles, and program governance.",
    category: "Privacy",
    frameworkTypes: ["gdpr", "iso27018"],
    tags: ["gdpr", "privacy", "program"],
    sortOrder: 310,
    contentHtml: doc(
      "Privacy & Data Protection Policy",
      `
<h2>3. Roles under GDPR (Art. 4, 24, 28)</h2>
<p>[[ROLE_STATEMENT]] — Where the organization acts as <em>controller</em> (e.g. employee data, marketing, billing) vs <em>processor</em> (customer data hosted in the SaaS).</p>
<h2>4. Principles (Art. 5)</h2>
<ul>
<li>Lawfulness, fairness &amp; transparency</li>
<li>Purpose limitation</li>
<li>Data minimisation</li>
<li>Accuracy</li>
<li>Storage limitation (link to Data Retention Policy)</li>
<li>Integrity &amp; confidentiality (link to ISMS)</li>
<li>Accountability — see §6 below.</li>
</ul>
<h2>5. Lawful bases (Art. 6) and special categories (Art. 9)</h2>
<p>[[LAWFUL_BASIS_REGISTER_REFERENCE]] — Each processing activity in the RoPA documents a lawful basis. Processing of special-category data requires explicit identification of an Art. 9(2) condition.</p>
<h2>6. Accountability evidence</h2>
<ul>
<li>Records of Processing Activities (RoPA) maintained per Art. 30.</li>
<li>DPIAs performed where Art. 35 applies.</li>
<li>Data subject rights handled per the DSR Procedure (Art. 12-22).</li>
<li>Personal-data breaches handled per the Breach Procedure (Art. 33-34).</li>
<li>Privacy by Design embedded into the SDLC (Art. 25).</li>
</ul>
<h2>7. Roles &amp; responsibilities</h2>
<p>[[DPO_OR_PRIVACY_LEAD]] — Whether a DPO is appointed (Art. 37); contact details published; reporting line; independence; resources.</p>
<h2>8. International transfers</h2>
<p>[[TRANSFER_REFERENCE]] — Link to the International Data Transfer Policy.</p>
<h2>9. Training &amp; awareness</h2>
<p>[[TRAINING_REFERENCE]] — Annual privacy training for all staff; role-specific training for engineers, support, and HR.</p>
`,
    ),
  },
  {
    slug: "gdpr-records-of-processing-procedure",
    title: "Records of Processing Activities (RoPA) Procedure",
    shortDescription:
      "GDPR Art. 30 — how RoPAs are created, reviewed, and kept current. Pairs with the Privacy workspace.",
    category: "Privacy",
    frameworkTypes: ["gdpr"],
    tags: ["gdpr", "ropa", "art-30"],
    sortOrder: 320,
    contentHtml: doc(
      "Records of Processing Activities (RoPA) Procedure",
      `
<h2>3. Required content per record (Art. 30(1) controller / Art. 30(2) processor)</h2>
<ul>
<li>Name &amp; purpose of the processing activity</li>
<li>Controller / processor role</li>
<li>Lawful basis (and Art. 9 condition where applicable)</li>
<li>Data categories &amp; data subject categories</li>
<li>Data elements / fields</li>
<li>Recipients (internal teams, sub-processors, joint controllers)</li>
<li>Cross-border transfers + transfer mechanism (Art. 46-49)</li>
<li>Retention period (link to the Data Retention Schedule)</li>
<li>Technical &amp; organisational measures (Art. 32) — generic statement linking to the ISMS</li>
<li>Owner</li>
</ul>
<h2>4. Creation &amp; ownership</h2>
<p>[[CREATION_TRIGGER]] — A new RoPA is created when a new product feature, integration, or business process processes personal data. Engineering / product owners draft; the DPO / Privacy lead reviews.</p>
<h2>5. Review cadence</h2>
<p>RoPAs are reviewed at least every [[12 months]] and on any material change. The Privacy workspace surfaces records due for review via "Mark Reviewed".</p>
<h2>6. DPIA trigger</h2>
<p>If the RoPA includes any of: large-scale special-category data, systematic monitoring of public areas, automated decision-making with significant effects, vulnerable subjects, novel technologies — a DPIA is initiated per the DPIA Procedure.</p>
<h2>7. Storage &amp; disclosure</h2>
<p>RoPAs are maintained in the Privacy workspace and exportable on request from a supervisory authority.</p>
`,
    ),
  },
  {
    slug: "gdpr-dsar-procedure",
    title: "Data Subject Rights Handling Procedure (DSAR)",
    shortDescription:
      "GDPR Art. 12-22 — receipt, identity verification, response, and SLA tracking for data subject requests.",
    category: "Privacy",
    frameworkTypes: ["gdpr"],
    tags: ["gdpr", "dsar", "rights"],
    sortOrder: 330,
    contentHtml: doc(
      "Data Subject Rights Handling Procedure",
      `
<h2>3. Rights covered</h2>
<ul>
<li>Access (Art. 15)</li>
<li>Rectification (Art. 16)</li>
<li>Erasure / "right to be forgotten" (Art. 17)</li>
<li>Restriction (Art. 18)</li>
<li>Portability (Art. 20)</li>
<li>Objection (Art. 21)</li>
<li>Not subject to automated decision-making (Art. 22)</li>
</ul>
<h2>4. Intake channels</h2>
<p>[[INTAKE_CHANNELS]] — Privacy email inbox, in-product portal, support ticket, postal address. All channels routed into the Privacy workspace DSAR register.</p>
<h2>5. Identity verification</h2>
<p>[[ID_VERIFICATION_RULES]] — Proportional to the sensitivity of the request; account-bound requests verified through the existing account; high-risk erasure requests may require additional proof. Avoid collecting more PII than necessary.</p>
<h2>6. SLAs (Art. 12(3))</h2>
<ul>
<li>Acknowledge receipt within [[5 business days]].</li>
<li>Substantive response within <strong>1 month</strong> of receipt.</li>
<li>One <strong>2-month extension</strong> permitted where the request is complex or numerous; the data subject must be informed of the extension and the reason within the original month.</li>
</ul>
<h2>7. Processor obligations</h2>
<p>[[PROCESSOR_FORWARDING]] — Where the organization is a processor (customer data), DSARs received are forwarded to the controller (customer) within [[5 business days]] per the DPA, and the organization assists per Art. 28(3)(e).</p>
<h2>8. Refusal grounds</h2>
<p>[[REFUSAL_REASONS]] — Manifestly unfounded or excessive requests, conflicts with the rights of others, legal obligations to retain. Refusals are documented with reasons and signed off by the DPO / Privacy lead.</p>
<h2>9. Records</h2>
<p>All requests, identity-verification artefacts, responses, and refusal rationales retained for [[3 years]] in the Privacy workspace.</p>
`,
    ),
  },
  {
    slug: "gdpr-personal-data-breach-procedure",
    title: "Personal Data Breach Notification Procedure",
    shortDescription:
      "GDPR Art. 33-34 — 72-hour supervisory authority notification clock and data subject communications.",
    category: "Incident Response",
    frameworkTypes: ["gdpr", "iso27001"],
    tags: ["gdpr", "breach", "art-33"],
    sortOrder: 340,
    contentHtml: doc(
      "Personal Data Breach Notification Procedure",
      `
<h2>3. Definition (Art. 4(12))</h2>
<p>A "personal data breach" is a breach of security leading to the accidental or unlawful destruction, loss, alteration, unauthorised disclosure of, or access to, personal data. This is broader than a security incident.</p>
<h2>4. Detection &amp; intake</h2>
<p>[[INTAKE]] — Suspected personal-data breaches are routed to the Security on-call <strong>and</strong> the DPO / Privacy lead. The Privacy workspace Data Breach register is opened immediately on suspicion (status: <em>open</em>); the 72-hour clock is auto-computed from <em>discoveredAt</em>.</p>
<h2>5. Triage (within 24 hours)</h2>
<ul>
<li>Confirm whether personal data is involved.</li>
<li>Establish category, volume of records, and data-subject categories affected.</li>
<li>Assess risk to data subjects (Art. 33 risk; Art. 34 high-risk).</li>
<li>Containment actions documented in the register.</li>
</ul>
<h2>6. Supervisory authority notification (Art. 33)</h2>
<p>Where the breach is likely to result in a risk to the rights and freedoms of natural persons, the relevant supervisory authority is notified within <strong>72 hours</strong> of becoming aware. If notification is not possible within 72 hours, reasons for the delay are documented. Status moves to <em>notified</em>.</p>
<h2>7. Data subject communication (Art. 34)</h2>
<p>Where the breach is likely to result in a <em>high</em> risk, affected data subjects are notified without undue delay using clear and plain language. Mass communication via a public notice is permitted where individual contact would involve disproportionate effort.</p>
<h2>8. Processor notification (Art. 33(2))</h2>
<p>Where the organization is a processor, the controller is notified <strong>without undue delay</strong> after becoming aware (per the DPA — typically [[24-48 hours]]).</p>
<h2>9. Records (Art. 33(5))</h2>
<p>All personal-data breaches — notifiable or not — are documented in the Privacy workspace breach register, including facts, effects, and remedial action. Records are retained for [[5 years]].</p>
<h2>10. Lessons learned</h2>
<p>Post-incident review held within [[10 business days]] of containment; remediation actions tracked as Tasks linked to the breach record.</p>
`,
    ),
  },
  {
    slug: "gdpr-dpia-procedure",
    title: "Data Protection Impact Assessment (DPIA) Procedure",
    shortDescription:
      "GDPR Art. 35 — when a DPIA is required, who performs it, the assessment template, and approval workflow.",
    category: "Privacy",
    frameworkTypes: ["gdpr"],
    tags: ["gdpr", "dpia", "art-35"],
    sortOrder: 350,
    contentHtml: doc(
      "Data Protection Impact Assessment Procedure",
      `
<h2>3. When a DPIA is required (Art. 35(3))</h2>
<ul>
<li>Systematic and extensive evaluation, including profiling, with significant effects.</li>
<li>Large-scale processing of special-category data (Art. 9) or criminal-conviction data (Art. 10).</li>
<li>Systematic monitoring of publicly accessible areas on a large scale.</li>
<li>Plus additional categories per the supervisory authority's list (e.g. EDPB / ICO criteria — innovative tech, biometric, location, vulnerable subjects, AI decisioning, etc.).</li>
</ul>
<h2>4. Initiation</h2>
<p>The product / engineering owner initiates a DPIA in the Privacy workspace as soon as a triggering processing activity is designed (before deployment). The DPIA links to the relevant RoPA.</p>
<h2>5. Required content</h2>
<ol>
<li>Systematic description of the processing operations and purposes.</li>
<li>Necessity and proportionality assessment.</li>
<li>Risks to rights and freedoms of data subjects.</li>
<li>Measures to address risks (incl. safeguards, security, mechanisms to demonstrate compliance).</li>
</ol>
<h2>6. Consultation</h2>
<p>[[CONSULTATION_RULES]] — DPO opinion sought. Where appropriate, views of data subjects or their representatives obtained. Where the residual risk remains <em>high</em>, prior consultation with the supervisory authority per Art. 36 is initiated.</p>
<h2>7. Approval</h2>
<p>DPIAs progress through <em>draft → in_review → approved | rejected</em> in the Privacy workspace. Approval requires sign-off by the DPO / Privacy lead; high-risk DPIAs additionally require sign-off by the [[CISO_OR_LEGAL]].</p>
<h2>8. Review</h2>
<p>DPIAs are reviewed when there is a change in the risk represented by the processing operation (at minimum every [[24 months]]).</p>
`,
    ),
  },
  {
    slug: "gdpr-international-transfer-policy",
    title: "International Data Transfer Policy",
    shortDescription:
      "GDPR Chapter V (Art. 44-49) — adequacy, SCCs, transfer impact assessments, and supplementary measures.",
    category: "Privacy",
    frameworkTypes: ["gdpr"],
    tags: ["gdpr", "transfers", "scc"],
    sortOrder: 360,
    contentHtml: doc(
      "International Data Transfer Policy",
      `
<h2>3. Default position</h2>
<p>Personal data is hosted within [[PRIMARY_REGION]] by default. Transfers to third countries occur only where one of the Chapter V mechanisms is in place.</p>
<h2>4. Transfer mechanisms recognised</h2>
<ul>
<li>Adequacy decision (Art. 45) — current list maintained at [[ADEQUACY_LIST_LINK]].</li>
<li>Standard Contractual Clauses (Art. 46(2)(c)) — current EU 2021/914 modules; UK IDTA where relevant.</li>
<li>Binding Corporate Rules (Art. 47) — for intra-group transfers, where adopted.</li>
<li>Derogations (Art. 49) — explicit consent, contract necessity, public interest, legal claims. Used as exceptions only.</li>
</ul>
<h2>5. Transfer Impact Assessment (Schrems II)</h2>
<p>[[TIA_PROCESS]] — Each new transfer to a non-adequate country undergoes a TIA covering recipient laws, government access, technical &amp; contractual safeguards, and a residual-risk decision. The TIA is recorded against the Vendor / Sub-processor and surfaced in the Privacy workspace Sub-processors view.</p>
<h2>6. Supplementary measures</h2>
<ul>
<li>Encryption at rest and in transit with keys not accessible to the importer.</li>
<li>Pseudonymisation where the use case allows.</li>
<li>Contractual transparency obligations on government access requests.</li>
</ul>
<h2>7. Sub-processor governance</h2>
<p>[[SUB_PROCESSOR_FLOW]] — Sub-processors handling personal data are listed in the Sub-processors register, DPA in place, location and transfer mechanism recorded, customers notified per the DPA notification window ([[30 days]] default).</p>
<h2>8. Records</h2>
<p>Transfer mechanisms, TIAs, and sub-processor lists retained for the lifetime of the processing activity + [[3 years]].</p>
`,
    ),
  },
  {
    slug: "gdpr-cookie-tracking-policy",
    title: "Cookie & Tracking Technologies Policy",
    shortDescription:
      "GDPR Art. 7 + ePrivacy — cookie classification, consent, and consent withdrawal for the marketing site and product.",
    category: "Privacy",
    frameworkTypes: ["gdpr"],
    tags: ["gdpr", "cookies", "consent"],
    sortOrder: 370,
    contentHtml: doc(
      "Cookie & Tracking Technologies Policy",
      `
<h2>3. Scope</h2>
<p>All cookies, local storage, pixels, SDKs, server-side tagging, and equivalent tracking technologies on [[DOMAINS]] (marketing site, product, support portal).</p>
<h2>4. Classification</h2>
<ul>
<li><strong>Strictly necessary</strong> — Required for service delivery (auth, security, load balancing). No consent required.</li>
<li><strong>Functional</strong> — Preferences, language. Consent required.</li>
<li><strong>Analytics</strong> — Aggregate usage measurement. Consent required (with limited exceptions where pseudonymised and no third-country transfer).</li>
<li><strong>Marketing / advertising</strong> — Cross-site tracking, ad personalisation. Explicit opt-in consent required.</li>
</ul>
<h2>5. Consent collection</h2>
<p>[[CMP]] — Consent Management Platform records granular per-category consent, timestamp, and the consent string. UI must present accept and reject with equal prominence; pre-ticked boxes are not used.</p>
<h2>6. Consent withdrawal</h2>
<p>A "Privacy preferences" link is available in the site footer at all times. Withdrawal must be as easy as giving consent.</p>
<h2>7. Records</h2>
<p>Consent records retained for [[24 months]] beyond the last interaction; CMP audit logs forwarded to the SIEM.</p>
<h2>8. Cookie inventory</h2>
<p>[[COOKIE_INVENTORY_OWNER]] — Maintained quarterly; new cookies / SDKs introduced via the SDLC must be added to the CMP and disclosed in the public Cookie Notice before deployment.</p>
`,
    ),
  },
  {
    slug: "gdpr-consent-management-policy",
    title: "Consent Management Policy",
    shortDescription:
      "GDPR Art. 7 — how consent is requested, recorded, and withdrawn for marketing, product features, and special-category data.",
    category: "Privacy",
    frameworkTypes: ["gdpr"],
    tags: ["gdpr", "consent", "art-7"],
    sortOrder: 380,
    contentHtml: doc(
      "Consent Management Policy",
      `
<h2>3. Standard for valid consent (Art. 4(11), Art. 7)</h2>
<ul>
<li>Freely given — no service is conditioned on consent for processing not necessary to provide it.</li>
<li>Specific — separate consent per processing purpose.</li>
<li>Informed — purpose, identity of controller, and right to withdraw clearly stated at the point of consent.</li>
<li>Unambiguous — clear affirmative action; no pre-ticked boxes, no silence, no inactivity.</li>
<li>Demonstrable — record of who consented, what they consented to, when, and how.</li>
</ul>
<h2>4. Special-category data (Art. 9)</h2>
<p>Where consent is the chosen Art. 9 condition, it must be <em>explicit</em>. Designs that rely on implicit or bundled consent are not acceptable.</p>
<h2>5. Children (Art. 8)</h2>
<p>[[CHILDREN_RULES]] — Where information-society services are offered directly to children, parental consent is required for users below the digital-age threshold in the relevant jurisdiction (16 default; lower per member-state law).</p>
<h2>6. Withdrawal</h2>
<p>Users can withdraw consent at any time. Withdrawal is recorded with timestamp; downstream processing tied to the consent ceases. Withdrawal does not affect lawfulness of processing performed before withdrawal.</p>
<h2>7. Records</h2>
<p>Consent strings / artefacts retained per the Data Retention Schedule; sufficient to evidence consent in an audit.</p>
<h2>8. Reviews</h2>
<p>Consent flows reviewed at least annually and on any material UX or scope change. Privacy by Design review (per the SDLC) covers any new consent surface.</p>
`,
    ),
  },
  {
    slug: "gdpr-dpo-appointment-policy",
    title: "Data Protection Officer (DPO) Appointment & Responsibilities",
    shortDescription:
      "GDPR Art. 37-39 — whether a DPO is required, the appointment, independence, tasks, and reporting line.",
    category: "Privacy",
    frameworkTypes: ["gdpr"],
    tags: ["gdpr", "dpo", "art-37"],
    sortOrder: 390,
    contentHtml: doc(
      "Data Protection Officer Appointment Policy",
      `
<h2>3. Designation determination (Art. 37(1))</h2>
<p>A DPO is designated where:</p>
<ul>
<li>Processing is carried out by a public authority; or</li>
<li>Core activities require regular and systematic monitoring of data subjects on a large scale; or</li>
<li>Core activities consist of large-scale processing of special-category or criminal-conviction data.</li>
</ul>
<p>[[DESIGNATION_DECISION]] — Document whether a DPO is mandatory, voluntary, or not designated, with reasoning, signed by [[OWNER]]. Re-evaluate annually.</p>
<h2>4. Position &amp; independence (Art. 38)</h2>
<ul>
<li>Reports directly to the highest level of management.</li>
<li>Provided with the resources and access necessary to perform tasks.</li>
<li>No instructions on how to perform DPO tasks; no dismissal or penalty for performing them.</li>
<li>No conflict of interest with other duties (cannot also be a controller of processing decisions).</li>
</ul>
<h2>5. Tasks (Art. 39)</h2>
<ul>
<li>Inform &amp; advise the organization and its employees of GDPR obligations.</li>
<li>Monitor compliance — including assignment of responsibilities, awareness training, and audits.</li>
<li>Provide advice on DPIAs and monitor their performance.</li>
<li>Cooperate with the supervisory authority and act as the contact point.</li>
</ul>
<h2>6. Contact &amp; publication</h2>
<p>The DPO contact details are published on the Privacy Notice and notified to the lead supervisory authority. Internal escalation path: [[INTERNAL_ESCALATION]].</p>
<h2>7. Privacy lead (where no DPO designated)</h2>
<p>Where no DPO is designated, the [[PRIVACY_LEAD_ROLE]] holds equivalent operational responsibility for the Privacy program; this role is not a "DPO" for the purposes of Art. 37 communications.</p>
`,
    ),
  },
  {
    slug: "blank-policy-scaffold",
    title: "Blank policy scaffold",
    shortDescription: "Minimal headings only — start from scratch with consistent structure.",
    category: "Governance",
    frameworkTypes: [],
    tags: ["blank", "custom"],
    sortOrder: 999,
    contentHtml: `<h1>[[POLICY_TITLE]]</h1>
<p><strong>Organization:</strong> [[ORGANIZATION_NAME]]</p>
<p><strong>Owner:</strong> [[POLICY_OWNER_ROLE]]</p>
<p><strong>Effective:</strong> [[EFFECTIVE_DATE]]</p>
<hr />
<h2>1. Purpose</h2>
<p>[[PURPOSE]]</p>
<h2>2. Scope</h2>
<p>[[SCOPE]]</p>
<h2>3. Policy</h2>
<p>[[POLICY_BODY]]</p>
<h2>4. Roles &amp; responsibilities</h2>
<p>[[ROLES]]</p>
<h2>5. Compliance &amp; exceptions</h2>
<p>[[COMPLIANCE]]</p>
<h2>6. Review</h2>
<p>[[REVIEW_FREQUENCY_AND_OWNER]]</p>
<hr />
${PLACEHOLDER_BLOCK}`,
  },
];

export async function seedPolicyTemplates(prisma: PrismaClient) {
  console.log("\nSeeding policy templates…");
  let created = 0;
  let updated = 0;
  for (const t of POLICY_TEMPLATE_DEFS) {
    const existing = await prisma.policyTemplate.findUnique({ where: { slug: t.slug } });
    const data = {
      title: t.title,
      shortDescription: t.shortDescription,
      category: t.category,
      frameworkTypes: t.frameworkTypes,
      tags: t.tags ?? [],
      contentHtml: t.contentHtml,
      sortOrder: t.sortOrder,
      isActive: true,
    };
    if (existing) {
      await prisma.policyTemplate.update({ where: { slug: t.slug }, data });
      updated++;
    } else {
      await prisma.policyTemplate.create({ data: { slug: t.slug, ...data } });
      created++;
    }
  }
  console.log(
    `  ✓ Policy templates: ${created} created, ${updated} updated (${POLICY_TEMPLATE_DEFS.length} total)`,
  );
}
