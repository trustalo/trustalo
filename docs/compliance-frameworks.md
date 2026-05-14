# Compliance Frameworks

Trustalo supports eight compliance frameworks. Each framework is modeled as a set of requirements and controls that can be mapped, tracked, and evidenced through the platform.

## Framework Overview

| Framework       | Focus                       | Controls/Requirements            | Standard Body |
| --------------- | --------------------------- | -------------------------------- | ------------- |
| ISO 27001:2022  | Information security (ISMS) | 93 controls                      | ISO/IEC       |
| ISO 27017:2015  | Cloud security              | 37 + 7 cloud-specific            | ISO/IEC       |
| ISO 27018:2019  | Cloud PII protection        | 25 PII controls                  | ISO/IEC       |
| ISO 22301:2019  | Business continuity         | BIA, BCP, DRP                    | ISO           |
| ISO 42001:2023  | AI management systems       | AI risk + governance             | ISO/IEC       |
| SOC 2           | Trust service criteria      | 5 TSC categories                 | AICPA         |
| Essential Eight | Cyber mitigation strategies | 8 strategies × 3 maturity levels | ACSC (AU)     |
| NIST CSF 2.0    | Cybersecurity outcomes      | 106 subcategories × 4 tiers      | NIST (US)     |

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

- **37 controls** derived from ISO 27002 with cloud implementation guidance
- **7 additional cloud-specific controls** unique to 27017
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

- **25 PII-specific controls** for public cloud environments
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
