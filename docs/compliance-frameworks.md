# Compliance Frameworks

Trustalo supports twelve compliance frameworks. Each framework is modeled as a set of requirements and controls that can be mapped, tracked, and evidenced through the platform.

## Framework Overview

| Framework | Focus | Controls/Requirements | Standard Body | Status |
| --- | --- | --- | --- | --- |
| ISO 27001:2022 | Information security (ISMS) | 93 controls | ISO/IEC | ![Experimental](https://img.shields.io/badge/status-experimental-orange) |
| ISO 27017:2015 | Cloud security | 7 CLD.\* + 19 cloud extensions (26 total) | ISO/IEC | ![Experimental](https://img.shields.io/badge/status-experimental-orange) |
| ISO 27018:2019 | Cloud PII protection | 11 PII principles + 17 cloud-PII controls (28 total) | ISO/IEC | ![Experimental](https://img.shields.io/badge/status-experimental-orange) |
| ISO 22301:2019 | Business continuity | 26 clauses (BIA, BCP, DRP) | ISO | ![Experimental](https://img.shields.io/badge/status-experimental-orange) |
| ISO 42001:2023 | AI management systems | 23 HLS clauses + 38 Annex A controls (61 total) | ISO/IEC | ![Experimental](https://img.shields.io/badge/status-experimental-orange) |
| SOC 2 | Trust service criteria | 61 TSC 2017 criteria (CC, A, PI, C, P) | AICPA | ![Experimental](https://img.shields.io/badge/status-experimental-orange) |
| Essential Eight | Cyber mitigation strategies | 8 strategies × 3 maturity levels | ACSC (AU) | ![Experimental](https://img.shields.io/badge/status-experimental-orange) |
| NIST CSF 2.0 | Cybersecurity outcomes | 106 subcategories × 4 tiers | NIST (US) | ![Experimental](https://img.shields.io/badge/status-experimental-orange) |
| GDPR | EU privacy / personal-data protection | ~35 obligations across Chapters II-V | EU (Regulation 2016/679) | ![Experimental](https://img.shields.io/badge/status-experimental-orange) |
| APRA CPS 234 | Information security for AU-regulated entities | 24 obligations (paras 13-36) | APRA (AU) | ![Experimental](https://img.shields.io/badge/status-experimental-orange) |
| HIPAA (2013 Omnibus) | US health-data security and privacy | 59 requirements (Security, Breach Notification, Privacy Rules) | HHS / OCR (US) | ![Experimental](https://img.shields.io/badge/status-experimental-orange) |
| PCI DSS 4.0.1 | Payment-card data security | 80 curated sub-requirements across the 12 principal requirements | PCI SSC | ![Experimental](https://img.shields.io/badge/status-experimental-orange) |

---

## ISO 27001:2022

**Information Security Management System (ISMS)**

The foundational framework for establishing, implementing, maintaining, and continually improving an information security management system.

### Key Components

- **93 controls** across 4 themes (Annex A)
- ISMS scope definition and context of the organization
- Statement of Applicability (SoA)
- Risk assessment and risk treatment methodology

### Control Themes

| Theme          | Controls | Examples                                           |
| -------------- | -------- | -------------------------------------------------- |
| Organizational | 37       | Policies, roles, asset management, supplier mgmt   |
| People         | 8        | Screening, awareness, training, disciplinary       |
| Physical       | 14       | Perimeters, equipment, clear desk, secure disposal |
| Technological  | 34       | Access control, crypto, logging, network security  |

### Platform Management

- Framework instance creation with scoped applicability
- SoA generation and export
- Risk assessment workflows with risk register
- Control implementation tracking with evidence attachment
- Internal audit management against ISMS requirements
- Gap analysis dashboard showing compliance posture

---

## ISO 27017:2015

**Cloud Security Controls**

Extension of ISO 27001 providing cloud-specific security guidance for both cloud service providers (CSPs) and cloud service customers.

### Key Components

- **19 controls** with cloud-specific extensions to ISO 27002 implementation guidance
- **7 additional cloud-specific controls** (CLD.\*) unique to 27017
- Provider vs. customer responsibility mapping (shared responsibility model)

### Cloud-Specific Controls (CLD)

| Control  | Area                                        |
| -------- | ------------------------------------------- |
| CLD.6.3  | Relationship between CSP and customer       |
| CLD.8.1  | Asset ownership in virtual environments     |
| CLD.9.5  | Virtual environment access control          |
| CLD.12.1 | Operations in multi-tenant environments     |
| CLD.12.4 | Admin operations logging for virtual env    |
| CLD.12.5 | Virtual network security monitoring         |
| CLD.13.1 | Shared or isolated virtual network security |

### Platform Management

- Responsibility matrix builder (provider vs. customer vs. shared)
- Mapping to existing ISO 27001 controls with cloud-specific extensions
- CSP evidence collection via integrations (AWS, Azure, GCP)
- Virtual environment control tracking

---

## ISO 27018:2019

**PII Protection in Public Cloud**

Code of practice for protection of personally identifiable information (PII) in public clouds acting as PII processors.

### Key Components

- **11 PII protection principles + 17 cloud-PII processor controls (28 total)** for public cloud environments
- Data subject rights management (access, rectification, erasure)
- Consent management and lawful processing basis
- Breach notification procedures and timelines
- Sub-processor management and data transfer controls

### Platform Management

- PII inventory and data flow mapping
- Data subject request (DSR) tracking and SLA monitoring
- Consent record management
- Breach notification workflow with regulatory timeline tracking
- Sub-processor register with assessment status
- Cross-reference to ISO 27001 controls for unified implementation

---

## ISO 22301:2019

**Business Continuity Management System (BCMS)**

Framework for planning, establishing, implementing, operating, monitoring, reviewing, maintaining, and continually improving a business continuity management system.

### Key Components

- Business Impact Analysis (BIA) with criticality scoring
- Recovery objectives: Recovery Time Objective (RTO) and Recovery Point Objective (RPO)
- Business Continuity Plans (BCP) for critical processes
- Disaster Recovery Plans (DRP) for IT systems and infrastructure
- Exercise and testing program with lessons learned

### Platform Management

- BIA creation wizard with dependency mapping
- RTO/RPO definition per critical process and system
- BCP document management with version control
- DRP template creation and maintenance
- Exercise scheduling, execution tracking, and post-exercise review
- Incident response integration (escalation from incident to BCP activation)
- Recovery metrics dashboard (actual vs. target RTO/RPO)

---

## ISO 42001:2023

**AI Management System (AIMS)**

Framework for organizations that develop, provide, or use AI systems to manage AI-related risks responsibly.

### Key Components

- AI system inventory and classification
- AI risk assessment covering bias, privacy, safety, transparency, and accountability
- Ethical review process for AI development and deployment
- Impact assessment methodology for affected stakeholders
- AI lifecycle governance (design, development, deployment, monitoring, decommission)

### Platform Management

- AI system registry with classification (risk level, autonomy level, deployment scope)
- AI risk assessment workflows with predefined risk categories:
  - **Bias and fairness** -- discrimination potential, dataset representativeness
  - **Privacy** -- data minimization, purpose limitation, PII handling
  - **Safety** -- physical and psychological harm potential
  - **Transparency** -- explainability, decision traceability
  - **Accountability** -- human oversight, appeal mechanisms
- Ethical review board workflow with approval gates
- AI impact assessment templates
- Cross-mapping to ISO 27001 controls for security aspects of AI systems
- Monitoring and performance tracking for deployed AI systems

---

## SOC 2

**Service Organization Control 2**

AICPA framework for evaluating an organization's controls relevant to security, availability, processing integrity, confidentiality, and privacy.

### Trust Service Criteria (TSC)

| Category                 | Focus                                                        |
| ------------------------ | ------------------------------------------------------------ |
| **Security**             | Protection against unauthorized access (CC series)           |
| **Availability**         | System uptime and operational resilience (A series)          |
| **Processing Integrity** | Accuracy, completeness, timeliness of processing (PI series) |
| **Confidentiality**      | Protection of confidential information (C series)            |
| **Privacy**              | Collection, use, retention, disposal of PII (P series)       |

### Type I vs. Type II

| Aspect       | Type I                            | Type II                                    |
| ------------ | --------------------------------- | ------------------------------------------ |
| Scope        | Control design at a point in time | Control design + operating effectiveness   |
| Period       | Single date                       | Observation period (typically 6-12 months) |
| Evidence     | Policies and procedures           | Policies + operational evidence over time  |
| Audit effort | Lower                             | Higher                                     |

### Platform Management

- TSC selection (Security is mandatory, others optional)
- Common Criteria (CC) control mapping
- Evidence collection per criterion with date-range tracking for Type II
- Continuous monitoring dashboard for control effectiveness
- Readiness assessment for Type I and gap-to-Type II analysis
- Auditor access portal with filtered evidence views

---

## Essential Eight (ACSC)

**Australian Cyber Security Centre — Essential Eight Maturity Model**

A prioritised set of eight mitigation strategies for hardening Microsoft Windows-based, internet-connected networks. Each strategy is evaluated at one of three maturity levels (ML1, ML2, ML3) describing the adversary tradecraft each level is intended to mitigate.

### The Eight Strategies

1. **Application control** — restrict execution to approved executables/scripts/installers.
2. **Patch applications** — vendor-aligned SLAs for application vulnerabilities.
3. **Configure Microsoft Office macro settings** — block macros except for vetted users.
4. **User application hardening** — browser/Office/PowerShell hardening (ASR rules, Constrained Language Mode).
5. **Restrict administrative privileges** — segregated admin accounts, jump servers, JIT admin.
6. **Patch operating systems** — vendor-aligned OS patch SLAs and supported versions.
7. **Multi-factor authentication** — phishing-resistant MFA for users, admins and important data.
8. **Regular backups** — coordinated backups, restoration testing, immutable storage.

### Identifier Scheme

`E8-<STRATEGY>-ML<n>` where `STRATEGY` is one of `APP_CONTROL`, `PATCH_APPS`, `MACROS`, `APP_HARDENING`, `PRIV_ACCESS`, `PATCH_OS`, `MFA`, `BACKUPS` and `n` ∈ {1, 2, 3}. Example: `E8-MFA-ML2`.

### Maturity Levels

- **ML1** — opportunistic adversaries using commodity tooling (baseline).
- **ML2** — adversaries willing to invest more time and use modest tradecraft.
- **ML3** — adaptive, well-resourced adversaries focused on specific targets.

The org's chosen `targetMaturityLevel` (stored on `FrameworkInstance`) is used by the UI to highlight in-scope requirements and dim stretch controls.

### Cross-Framework Mappings

The seeder loads two mapping files for Essential Eight:

- `essential8_to_iso27001.json` — derived from the ACSC mapping appendix (Apr 2024).
- `essential8_to_soc2.json` — derived from AICPA TSC 2017 (rev. 2022) and Drata's published cross-walk.
- `essential8_to_nist-csf-2.json` — manually verified via the E8 → ISO → CSF chain.

---

## NIST Cybersecurity Framework 2.0

**NIST CSF 2.0 (Feb 2024)**

A voluntary, outcome-based cybersecurity framework. CSF 2.0 reorganises the older five Functions (`Identify`, `Protect`, `Detect`, `Respond`, `Recover`) by introducing a new top-level Function — `Govern` — and rewrites every subcategory as an outcome statement.

### The Six Functions

1. **Govern (GV)** — strategy, roles, policy, supply chain risk, oversight.
2. **Identify (ID)** — asset, risk, supply-chain, and improvement understanding.
3. **Protect (PR)** — identity & access, awareness, data, platform, and resilience.
4. **Detect (DE)** — continuous monitoring and adverse event analysis.
5. **Respond (RS)** — incident management, analysis, response and reporting.
6. **Recover (RC)** — recovery planning and recovery communications.

### Structure

- **6 Functions** → **22 Categories** → **106 Subcategories**.
- Each subcategory has an outcome statement (used as `description`) and a list of NIST Implementation Examples (surfaced via `evidenceGuidance`).
- Identifier scheme: `<FUNC>.<CAT>-<NN>` (e.g. `PR.AA-01`).

### Implementation Tiers

CSF 2.0 retains four implementation tiers describing the rigor of the cybersecurity risk governance and management practices:

- **Tier 1 — Partial** — informal, ad-hoc.
- **Tier 2 — Risk Informed** — risk-aware but not consistently formalised.
- **Tier 3 — Repeatable** — formally approved policies, regularly updated.
- **Tier 4 — Adaptive** — continuously improving based on lessons learned and predictive indicators.

The org's chosen tier is stored on `FrameworkInstance.targetMaturityLevel` (reusing the same generic field as Essential Eight maturity levels).

### Cross-Framework Mappings

The seeder loads two NIST CSF mapping files:

- `nist-csf-2_to_iso27001.json` — derived from NIST's Informative References (OLIR) for CSF 2.0.
- `essential8_to_nist-csf-2.json` — manually verified via the E8 → ISO → CSF chain.

In addition, `soc2_to_iso27001.json` provides full SOC 2 TSC ↔ ISO 27001:2022 Annex A coverage, completing the four-way cross-walk between Essential Eight, ISO 27001, SOC 2 and NIST CSF 2.0.

---

## APRA CPS 234

**Australian Prudential Regulation Authority — Prudential Standard CPS 234 Information Security**

CPS 234 (Nov 2018, effective 1 July 2019) imposes information-security obligations on APRA-regulated entities — banks (ADIs), general insurers, life insurers, private health insurers, RSE licensees (super funds), and their authorised non-operating holding companies. The standard is binary (no maturity tiers) and is supplemented by the non-binding APRA CPG 234 practice guide (Jun 2019).

### Structure

- **24 requirements** modelled from the operational obligations in paragraphs 13-36 of the standard.
- Identifier scheme: `CPS234-<paragraph>` (e.g. `CPS234-30`).
- Categories follow the structure of the standard so the dashboard groups requirements naturally:
  - Roles and responsibilities (paras 13-14)
  - Information security capability (paras 15-19)
  - Policy framework (paras 20-22)
  - Information asset identification and classification (paras 23-24)
  - Implementation of controls (paras 25-29)
  - Incident management (para 30)
  - Testing control effectiveness (para 31)
  - Internal audit (para 32)
  - APRA notification (paras 33-36)

### Distinctive Obligations

Two CPS 234 obligations have no direct equivalent in the ISO/AICPA frameworks and are therefore worth tracking explicitly:

- **72-hour APRA notification (Para 33)** — material information-security incidents must be notified to APRA "as soon as possible" and within 72 hours of becoming aware. The clock does not pause for weekends.
- **10-business-day control-weakness notification (Para 35)** — material information-security control weaknesses that the entity does not expect to remediate in a timely manner must be notified within 10 business days.

The Privacy / Incident Response register supports both clocks via the existing breach-clock infrastructure.

### Cross-Framework Mappings

The seeder loads:

- `cps234_to_iso27001.json` — derived from APRA CPG 234 (Jun 2019), the AustCyber CPS 234 ↔ ISO 27001 cross-walk, and Vanta / Drata / AuditBoard published cross-walks. CPS 234 is heavily ISO-aligned, so this mapping covers ~80% of overlap; CPS 234 → SOC 2 / NIST CSF can be derived transitively via ISO 27001 in the cross-framework view.

### Policy Templates

CPS 234 ships with three Australia-specific policy templates not present in the ISO/SOC 2 packs:

- `cps234-information-security-capability-policy` — paras 15-19 (capability sizing, third-party capability, independent assessment).
- `cps234-information-asset-classification-policy` — paras 23-24 (criticality and sensitivity classification driving control selection).
- `cps234-apra-notification-procedure` — paras 33-36 (the 72-hour and 10-business-day notification clocks, content, sign-off, record-keeping).

Existing templates re-used for CPS 234 (tagged with `cps234`): Information Security Policy (ISMS), Access Control Policy, Incident Response Policy, Vendor &amp; Third-Party Risk Policy, Change Management Policy, Logging &amp; Security Monitoring Policy, Asset Management Policy, Risk Management Policy, Secure Development Policy.

---

## HIPAA (2013 Omnibus)

**US Health Insurance Portability and Accountability Act — 45 CFR Part 164**

HIPAA imposes security and privacy obligations on covered entities (providers, health plans, clearinghouses) and their business associates for protected health information (PHI). Trustalo models the parts of Part 164 that are practically auditable: the full Security Rule, the Breach Notification Rule, and a small set of operational Privacy Rule requirements. There are no maturity tiers.

### Structure

- **59 requirements** written as original summaries of the primary CFR text.
- Identifier scheme: CFR-style citations, e.g. `164.308(a)(1)(ii)(A)`, `164.404`.
- Categories follow the regulation's structure:
  - Administrative Safeguards (§164.308) — risk analysis/management, workforce security, access management, training, incident procedures, contingency planning, evaluation, BAAs
  - Physical Safeguards (§164.310) — facility access, workstation use/security, device and media controls
  - Technical Safeguards (§164.312) — access control, audit controls, integrity, authentication, transmission security
  - Organizational Requirements (§164.314) — BAA security-clause content
  - Policies &amp; Documentation (§164.316) — written policies, six-year documentation retention
  - Breach Notification (§§164.400-414) — breach risk assessment, individual/media/HHS/business-associate notification
  - Privacy Rule (selected) — minimum necessary (§164.502(b)), privacy BAA content (§164.504(e)), notice of privacy practices (§164.520), individual rights (§§164.524-528), privacy administration (§164.530)

### Curation Notes

- Where a Security Rule standard is fully expressed by its numbered implementation specifications, the pack lists the specifications and omits the umbrella standard so each entry is individually evidencable.
- Rarely-applicable specifications (clearinghouse isolation §164.308(a)(4)(ii)(A), group-health-plan documents §164.314(b)) are deliberately omitted.
- "Addressable" vs "Required" (§164.306(d)) is noted in descriptions; addressable never means optional.

### Distinctive Obligations

- **60-day breach notification (§164.404/§164.408)** — individuals must be notified within 60 calendar days of discovery; HHS contemporaneously for 500+ individual breaches, or via the annual portal log for smaller ones. The breach-clock infrastructure in the Privacy / Incident Response register supports this timeline.
- **Encryption safe harbor** — breach notification applies to _unsecured_ PHI, so encryption at rest and in transit (§164.312(a)(2)(iv), §164.312(e)(2)(ii)) effectively removes lost-data incidents from the notification regime.
- **Six-year documentation retention (§164.316(b)(2))** — all Security Rule policies, assessments and action records.

### Cross-Framework Mappings

The seeder loads two mapping files for HIPAA:

- `hipaa_to_iso27001.json` — written from the CFR text against ISO 27001:2022 Annex A intent, informed by the NIST SP 800-66r2 crosswalk appendix.
- `hipaa_to_soc2.json` — HIPAA + SOC 2 is the standard US health-tech dual-audit combination; CC-series for the Security Rule, A-series for contingency, P-series for the Privacy and Breach Notification Rules.

---

## PCI DSS 4.0.1

**Payment Card Industry Data Security Standard v4.0.1**

PCI DSS applies to every entity that stores, processes or transmits cardholder data, or that could affect the security of the cardholder data environment (CDE). Version 4.0.1 (June 2024) consolidates v4.0 plus its errata; the formerly future-dated v4.0 requirements (e.g. payment-page script management, automated log review) are now mandatory and are included in the pack.

### Structure

- **80 curated sub-requirements** across the 12 principal requirements, written as original paraphrases of requirement intent (PCI SSC's standard text is copyrighted and is not reproduced).
- Identifier scheme: the standard's own numbering (e.g. `3.5.1`, `11.4.5`) so ROC/SAQ workpapers line up.
- Categories are the six PCI SSC goals:

| Goal (category)                                | Principal requirements |
| ---------------------------------------------- | ---------------------- |
| Build and Maintain Secure Networks and Systems | 1-2                    |
| Protect Account Data                           | 3-4                    |
| Maintain a Vulnerability Management Program    | 5-6                    |
| Implement Strong Access Control Measures       | 7-9                    |
| Regularly Monitor and Test Networks            | 10-11                  |
| Maintain an Information Security Policy        | 12                     |

### Curation Notes

Following the GDPR pack's philosophy, the pack curates to the granularity a QSA/ISA samples first rather than mechanically expanding all ~250 defined-approach requirements and testing procedures:

- The recurring "x.1.1 / x.1.2 — processes documented, roles assigned" governance pair that opens every principal requirement is captured once via requirement 12.1.x.
- Niche appendix items (shared hosting providers, SSL/early-TLS entities) are omitted.

### Distinctive Obligations

- **Fixed cadences** — quarterly internal and ASV vulnerability scans (11.3.x), semi-annual NSC ruleset and access reviews (1.2.7, 7.2.4), annual penetration and segmentation testing (11.4.x), annual TPSP compliance monitoring (12.8.4).
- **Targeted risk analysis (12.3.1)** — v4 lets entities choose the frequency of certain controls, but each choice needs a documented, annually-refreshed risk analysis.
- **E-commerce skimming defences (6.4.3, 11.6.1)** — payment-page script inventories with integrity assurance, and weekly tamper detection of page content/headers as delivered to the consumer browser.

### Cross-Framework Mappings

The seeder loads two mapping files for PCI DSS:

- `pci-dss-4_to_iso27001.json` — requirement-intent cross-walk to ISO 27001:2022 Annex A. PCI controls are CDE-scoped and prescriptive, so most relationships are `partial` (the evidence satisfies the Annex A intent inside the CDE but not necessarily org-wide).
- `pci-dss-4_to_soc2.json` — cross-walk to the AICPA TSC 2017 (rev. 2022) criteria for entities running PCI and SOC 2 programs side by side.

---

## Cross-Framework Control Mapping

Many controls overlap across frameworks. Trustalo implements a cross-framework mapping system to reduce duplicate effort.

### Approach

1. **Canonical controls** -- Each control is stored once with a unique identifier
2. **ControlRequirementAssignment** -- An organization-scoped assignment table links framework-specific requirements to controls
3. **Shared evidence** -- Evidence attached to a control satisfies all assigned framework requirements simultaneously

### Example Mappings

| Control Area        | ISO 27001   | ISO 27017 | ISO 27018 | SOC 2     |
| ------------------- | ----------- | --------- | --------- | --------- |
| Access control      | A.8.3-8.5   | CLD.9.5   | A.11.6    | CC6.1-6.3 |
| Logging/monitoring  | A.8.15-8.16 | CLD.12.4  | A.12.4    | CC7.2     |
| Encryption          | A.8.24      | A.10.1    | A.11.3    | CC6.7     |
| Incident management | A.5.24-5.28 | A.16.1    | A.9.1     | CC7.3-7.5 |

This mapping allows organizations pursuing multiple certifications to track a unified set of controls while satisfying the specific language of each framework's requirements.
