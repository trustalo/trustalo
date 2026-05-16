# Trustalo - Compliance Domain Knowledge

Reference for AI agents working on Trustalo compliance features. Covers all eight supported frameworks (six ISO/AICPA + ACSC Essential Eight + NIST CSF 2.0), cross-framework mapping, evidence strategies, and module responsibilities.

---

## Supported Frameworks

### 1. ISO/IEC 27001:2022 — Information Security Management System (ISMS)

The foundational framework. Most organizations adopt this first; the other ISO standards extend or complement it.

**Structure:**

- Clauses 4-10: management system requirements (context, leadership, planning, support, operation, performance evaluation, improvement)
- Annex A: 93 controls organized into 4 themes

**Annex A Themes (93 controls total):**

| Theme              | Controls | Prefix | Examples                                         |
| ------------------ | -------- | ------ | ------------------------------------------------ |
| Organizational (5) | 37       | A.5.x  | Policies, roles, threat intelligence, asset mgmt |
| People (6)         | 8        | A.6.x  | Screening, awareness, remote working             |
| Physical (7)       | 14       | A.7.x  | Perimeters, equipment, cabling, monitoring       |
| Technological (8)  | 34       | A.8.x  | Access control, encryption, logging, DLP         |

**What Trustalo manages:**

- Framework adoption lifecycle (draft -> active -> under_review -> archived)
- Requirement tracking per clause and Annex A control
- Statement of Applicability (SoA) — which controls apply and why
- Control implementation status and evidence linking
- Risk assessment tied to controls (likelihood x impact matrix)
- Internal audit scheduling and findings tracking

---

### 2. ISO/IEC 27017:2015 — Cloud Security Controls

Extends ISO 27001 with cloud-specific guidance. Applies to both cloud service providers (CSPs) and cloud service customers (CSCs).

**Structure:**

- 37 extended controls from ISO 27002 with cloud context
- 7 new cloud-specific controls (CLD.6.3.1, CLD.8.1.5, CLD.9.5.1, CLD.9.5.2, CLD.12.1.5, CLD.12.4.5, CLD.13.1.4)

**Key areas:**

- Shared responsibility delineation (CSP vs CSC)
- Virtual machine hardening and isolation
- Cloud administrative operations security
- Monitoring of cloud service activity
- Virtual network security controls
- Cloud data removal/return on contract end

**What Trustalo manages:**

- Mapping 27017 controls to parent 27001 controls
- CSP/CSC responsibility matrix per control
- Cloud-specific evidence collection (cloud config, IAM policies, network rules)
- Gap analysis between 27001 base and 27017 extension

---

### 3. ISO/IEC 27018:2019 — PII Protection in Public Cloud

Extends ISO 27001/27002 with privacy-specific controls for cloud-hosted PII (Personally Identifiable Information).

**Structure:**

- 25 controls addressing PII processing in cloud environments
- Aligns with GDPR and other privacy regulations

**Key areas:**

- Consent and choice for PII principals
- Purpose limitation and data minimization
- Use and disclosure limitations
- Data portability and return
- Subcontractor (sub-processor) management
- PII breach notification procedures
- Transparency on cloud data location

**What Trustalo manages:**

- PII inventory and data flow mapping
- Processing purpose register
- Sub-processor tracking (via vendor management module)
- Privacy impact assessments
- Breach notification workflow
- Evidence of privacy controls (DPA, consent mechanisms, encryption)

---

### 4. ISO 22301:2019 — Business Continuity Management System (BCMS)

Ensures the organization can continue operating during and after a disruptive event.

**Key concepts:**

- **BIA** (Business Impact Analysis): identifies critical processes and their dependencies
- **RTO** (Recovery Time Objective): maximum tolerable downtime per process
- **RPO** (Recovery Point Objective): maximum tolerable data loss window
- **MTPD** (Maximum Tolerable Period of Disruption): absolute limit before irreversible harm
- **BCP** (Business Continuity Plan): documented procedures for responding to disruptions

**Structure:**

- Clauses 4-10: management system requirements (mirrors 27001 HLS)
- Clause 8 (Operation) is where BIA, risk assessment, strategy, and BCP content lives

**What Trustalo manages (via `bcp` module):**

- Business impact analysis records
- Critical process inventory with RTO/RPO targets
- Continuity strategy selection and documentation
- BCP document management and versioning
- Exercise/test scheduling and results tracking
- Incident response and activation procedures
- Recovery evidence and post-incident review

---

### 5. ISO/IEC 42001:2023 — AI Management System (AIMS)

Governs the responsible development, deployment, and use of AI systems. The newest standard in our portfolio.

**Structure:**

- Clauses 4-10: management system requirements
- Annex A: 38 controls in 4 domains
- Annex B: AI risk sources
- Annex C: AI objectives
- Annex D: Use of AIMS across domains

**Annex A domains:**

1. AI system impact assessment
2. Data for AI systems (quality, provenance, bias)
3. AI system development and monitoring (lifecycle, testing, drift)
4. AI system operation and third-party relationships

**What Trustalo manages (via `ai-governance` module):**

- AI system inventory and classification
- Impact assessments per AI system
- Data governance records (lineage, quality, bias evaluation)
- Model lifecycle tracking (development, testing, deployment, monitoring)
- Third-party AI component register
- Transparency and explainability documentation
- Human oversight requirements and evidence

---

### 6. SOC 2 — Service Organization Control 2

AICPA framework for service organizations. Based on 5 Trust Service Criteria (TSC).

**Trust Service Criteria:**

| Criteria             | Code | Focus                                              |
| -------------------- | ---- | -------------------------------------------------- |
| Security             | CC   | Protection against unauthorized access (required)  |
| Availability         | A    | System uptime and performance                      |
| Processing Integrity | PI   | Accurate, complete, timely processing              |
| Confidentiality      | C    | Protection of confidential information             |
| Privacy              | P    | Collection, use, retention of personal information |

**SOC 2 report types:**

- Type I: control design at a point in time
- Type II: control design AND operating effectiveness over a period (typically 3-12 months)

**Key areas:**

- CC1: Control Environment (management philosophy, HR policies)
- CC2: Communication and Information
- CC3: Risk Assessment
- CC4: Monitoring Activities
- CC5: Control Activities
- CC6: Logical and Physical Access Controls
- CC7: System Operations
- CC8: Change Management
- CC9: Risk Mitigation

**What Trustalo manages:**

- TSC selection per engagement (Security is always required)
- Control points mapped to each selected criterion
- Continuous evidence collection for Type II readiness
- Auditor workspace and findings management
- Trust center for sharing SOC 2 report status externally

---

### 7. Essential Eight (ACSC) — Australian Cyber Mitigation Strategies

The Australian Cyber Security Centre's prioritised set of eight technical controls for hardening Microsoft Windows-based, internet-connected networks. Unlike the ISO/AICPA frameworks (which are outcome-based), the Essential Eight is **technique-specific** and graded against three maturity levels.

**Structure:**

- 8 mitigation strategies × 3 maturity levels = 24 requirements
- Identifier scheme: `E8-<STRATEGY>-ML<n>` (e.g. `E8-MFA-ML2`)
- `Requirement.maturityLevel` ∈ `ml1` | `ml2` | `ml3`
- `FrameworkInstance.targetMaturityLevel` records the org's target level

**Strategies:**

| Code          | Strategy                                  |
| ------------- | ----------------------------------------- |
| APP_CONTROL   | Application control                       |
| PATCH_APPS    | Patch applications                        |
| MACROS        | Configure Microsoft Office macro settings |
| APP_HARDENING | User application hardening                |
| PRIV_ACCESS   | Restrict administrative privileges        |
| PATCH_OS      | Patch operating systems                   |
| MFA           | Multi-factor authentication               |
| BACKUPS       | Regular backups                           |

**What Trustalo manages:**

- 24 requirements seeded from the Nov 2023 maturity model
- Maturity-level chip on each control + maturity picker on adoption
- Cross-framework mappings to ISO 27001 (`essential8_to_iso27001.json`), SOC 2 (`essential8_to_soc2.json`), and NIST CSF 2.0 (`essential8_to_nist-csf-2.json`) loaded by `seedFrameworkMappings()`

---

### 8. NIST Cybersecurity Framework 2.0

NIST's outcome-based cybersecurity framework. CSF 2.0 (Feb 2024) added the `Govern` Function and rewrote every subcategory as a measurable outcome.

**Structure:**

- 6 Functions × 22 Categories × **106 Subcategories**
- Identifier scheme: `<FUNC>.<CAT>-<NN>` (e.g. `PR.AA-01`)
- Functions: `GV` (Govern), `ID` (Identify), `PR` (Protect), `DE` (Detect), `RS` (Respond), `RC` (Recover)
- Implementation Tiers (1–4) stored on `FrameworkInstance.targetMaturityLevel` (reusing the generic tiered field):
  - `tier1` Partial · `tier2` Risk Informed · `tier3` Repeatable · `tier4` Adaptive

**What Trustalo manages:**

- 106 subcategories seeded from NIST's official outcome statements (CSF 2.0 release Feb 2024)
- `category` is rendered as `<func>.<cat> — <name>` so the UI can group by Function and Category
- Implementation Examples are surfaced as `evidenceGuidance`
- Tier picker on adoption (reuses the generic tiered framework picker)
- Cross-framework mappings:
  - `nist-csf-2_to_iso27001.json` — derived from NIST OLIR Informative References for CSF 2.0
  - `essential8_to_nist-csf-2.json` — manually verified via E8 → ISO → CSF
  - `soc2_to_iso27001.json` — AICPA TSC → ISO 27001:2022 (full coverage of CC1–CC9, A1, C1)

---

## Cross-Framework Control Mapping

Trustalo maps controls across frameworks to reduce duplication. A single implemented control can satisfy requirements in multiple frameworks.

**Mapping approach:**

1. ISO 27001 Annex A controls serve as the canonical base
2. Each framework's requirements map to one or more 27001 controls where overlap exists
3. Framework-specific controls (e.g., CLD._ for 27017, TSC CC_ for SOC 2) exist as standalone entries when there is no 27001 equivalent
4. The `controls` module maintains a `controlMapping` table: `(controlId, frameworkId, requirementCode)`

**Example mappings:**

| ISO 27001 | ISO 27017  | SOC 2 | Topic                         |
| --------- | ---------- | ----- | ----------------------------- |
| A.5.1     | —          | CC1.1 | Information security policies |
| A.8.5     | CLD.9.5.1  | CC6.1 | Authentication management     |
| A.8.24    | —          | CC6.8 | Cryptographic controls        |
| A.8.15    | CLD.12.4.5 | CC7.2 | Logging and monitoring        |

**When adding new framework support:**

1. Define the framework's requirements in the frameworks module
2. Create initial control mappings to existing 27001 controls
3. Add standalone controls for framework-specific requirements
4. Update dashboard metrics to include the new framework

---

## Evidence Types and Collection Strategies

### Evidence categories

| Category | Description | Examples |
| --- | --- | --- |
| Technical | Automated system configuration evidence | IAM policies, firewall rules, encryption settings |
| Document | Policies, procedures, plans | ISMS policy, BCP document, AI ethics policy |
| Screenshot | Point-in-time visual proof | Dashboard screenshots, config screens |
| Log | System-generated audit trails | Access logs, change logs, deployment logs |
| Assessment | Evaluation results | Risk assessments, BIA, pen test reports |
| Certification | External attestations | Vendor SOC 2 reports, ISO certificates |
| Training | Awareness and competency proof | Training completion records, quiz scores |

### Collection strategies

- **Automated (Collector)**: integration providers pull evidence on a schedule (e.g., AWS config snapshots, GitHub branch protection rules)
- **Manual upload**: users upload documents, screenshots, or certificates via the web UI
- **API submission**: external tools push evidence via `POST /api/v1/evidence`
- **Generated**: system-generated evidence from internal operations (audit logs, compliance snapshots)

### Evidence lifecycle

1. **Collected/Uploaded** — raw evidence enters the system
2. **Mapped** — linked to one or more controls
3. **Reviewed** — compliance manager verifies relevance and accuracy
4. **Approved** — auditor or approver signs off
5. **Expired** — past validity period; needs recollection

---

## Module Responsibilities

| Module | Service | Frameworks Served | Responsibility |
| --- | --- | --- | --- |
| frameworks | API | All | Framework lifecycle, requirement definitions |
| controls | API | All | Control definitions, cross-framework mapping |
| policies | API | 27001, SOC 2 | Policy CRUD, versioning, approval workflow |
| risks | API | 27001, 22301, 42001 | Risk register, assessment, treatment plans |
| evidence | API | All | Evidence storage, approval, control linkage |
| vendors | API | 27001, 27018, SOC 2 | Third-party assessment, sub-processor tracking |
| assets | API | 27001, 27017 | Information asset inventory, classification |
| incidents | API | 27001, 22301, SOC 2 | Security incident lifecycle |
| audits | API | All | Internal/external audit planning and findings |
| bcp | API | 22301 | BIA, BCP, RTO/RPO, exercises, recovery evidence |
| ai-governance | API | 42001 | AI system inventory, impact assessment, lifecycle |
| training | API | 27001, SOC 2 | Awareness campaigns, completion tracking |
| trust-center | API | SOC 2 | Public compliance status page |
| dashboards | API | All | Metrics, posture scores, gap analysis |
| connections | Collector | All (evidence collection) | Integration connection CRUD |
| jobs | Collector | All (evidence collection) | Collection job trigger and management |
| providers | Collector | All (evidence collection) | Available integration provider listing |
| sync-logs | Collector | All (evidence collection) | Collection run history and status |
