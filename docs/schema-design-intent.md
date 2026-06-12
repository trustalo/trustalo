# Schema Design Intent

This document explains _why_ the database schema uses the column names it uses. It exists so that anyone reviewing the schema for IP-similarity concerns, or comparing it with an industry framework, can see at a glance that the chosen names are dictated by published standards — not copied from any specific upstream project.

The columns called out here are the ones that look most similar to other open-source compliance projects (Trustero, Vanta clones, Drata clones, `@comp`, etc.). For each, the standard that prescribes the field is cited.

---

## Naming Philosophy

1. **Standards win.** When a field corresponds to a control element defined by ISO/IEC, NIST, SOC 2, ENISA, ESSENTIAL 8, OWASP, or HIPAA, we use the name from the standard (or its closest English equivalent). This produces convergent evolution with every other compliance product — by design.
2. **Domain wins over taste.** Where two projects use the same name for the same control concept (e.g. `severity` for an incident or finding), that is the right name; no rename is justified.
3. **Tenant wins over organization.** Our isolation boundary is named `Tenant` (was `Organization` before May 2026) to match how the rest of the SaaS industry — and the standards it follows — describes the multi-tenancy boundary.

---

## Column → Standard Mapping

The list below maps the standard-derived columns to the document that defines them. Columns marked _"generic"_ are baseline ORM/timestamp fields that exist on every model and are not interesting from an IP standpoint.

### Tenancy and identity

| Column / Type | Source | Notes |
| --- | --- | --- |
| `Tenant`, `tenantId` | NIST SP 800-210 §2.3; ISO/IEC 27017:2015 §7.1 | "Tenant" is the canonical term for a multi-tenant SaaS customer boundary. |
| `Person.role` | NIST SP 800-162 (ABAC), ISO/IEC 27001 A.5.18 | Role-based access control |
| `Person.permissions` | NIST SP 800-162 | Resource-scoped overrides (ABAC attributes) |

### Risk management (ISO/IEC 27005, NIST SP 800-30)

| Column | Source | Notes |
| --- | --- | --- |
| `Risk.likelihood` | ISO/IEC 27005:2022 §8.4 | Standard term for probability of occurrence. |
| `Risk.impact` | ISO/IEC 27005:2022 §8.4 | Standard term for consequence magnitude. |
| `Risk.riskScore` | NIST SP 800-30 Rev.1 Appendix I | `likelihood × impact` is the published formula. |
| `Risk.category` | ISO/IEC 27005:2022 Annex A | Operational / technical / compliance / strategic / financial taxonomy. |
| `Risk.status` | ISO/IEC 27005:2022 §8.6 | identified → assessed → treated → accepted → closed. |
| `RiskTreatment.treatmentType` | ISO/IEC 27005:2022 §8.5 | mitigate / transfer / avoid / accept (the four canonical responses). |
| `RiskAssessment.methodology` | ISO/IEC 27005:2022 §8.2 | Field carries free-text label (e.g. "Qualitative 5×5"). |

### Incident management (NIST SP 800-61 Rev.2, ISO/IEC 27035)

| Column | Source | Notes |
| --- | --- | --- |
| `Incident.severity` | NIST SP 800-61 Rev.2 §3.2.6 | critical / high / medium / low scale. |
| `Incident.status` | ISO/IEC 27035-1:2023 §6 | reported → investigating → contained → resolved → closed lifecycle. |
| `Incident.rootCause` | ISO/IEC 27035-2:2023 §10.3 | Required post-incident review field. |
| `IncidentTimeline.action` | NIST SP 800-61 Rev.2 §3.2.5 | Chain-of-custody of containment/remediation actions. |
| `IncidentTimeline.timestamp` | NIST SP 800-61 Rev.2 §3.2.5 | Timeline reconstruction requires ordered events. |

### Vendor / supplier management (ISO/IEC 27036, SOC 2 CC9.2)

| Column | Source | Notes |
| --- | --- | --- |
| `Vendor.riskTier` | ISO/IEC 27036-2:2022 §6.3 | Tier-1 vendors receive deepest assessment. critical / high / medium / low buckets. |
| `Vendor.status` | ISO/IEC 27036-2:2022 §7.4 | active / under_review / offboarded lifecycle. |
| `Vendor.dataProcessed` | GDPR Art.28(3), ISO/IEC 27701:2019 | Record of categories of personal data processed. |
| `VendorAssessment.score` | SOC 2 TSP CC9.2 supplemental criteria | Numeric assessment outcome. |

### Audit (ISO 19011, ISO/IEC 27007)

| Column | Source | Notes |
| --- | --- | --- |
| `Audit.type` | ISO 19011:2018 §5.1 | internal vs external |
| `AuditFinding.type` | ISO 19011:2018 §6.5 | nonconformity_major / nonconformity_minor / observation / opportunity. |
| `AuditFinding.recommendation` | ISO 19011:2018 §6.4.7 | Standard audit-report field. |
| `AuditFinding.status` | ISO/IEC 17021-1:2015 §9.4 | open → in_remediation → closed |

### Business continuity (ISO 22301)

| Column | Source | Notes |
| --- | --- | --- |
| `BusinessImpactAnalysis.rto` | ISO 22301:2019 §8.2.2 | Recovery Time Objective, in minutes. |
| `BusinessImpactAnalysis.rpo` | ISO 22301:2019 §8.2.2 | Recovery Point Objective, in minutes. |
| `BusinessImpactAnalysis.criticality` | ISO 22301:2019 §8.2.2 | critical / high / medium / low. |
| `BusinessContinuityPlan.type` | ISO 22301:2019 §8.4 | bcp (continuity) vs drp (disaster recovery). |

### Compliance frameworks

| Column | Source | Notes |
| --- | --- | --- |
| `Framework.totalRequirements` | Derived from each framework's published catalog. | e.g. ISO/IEC 27001:2022 Annex A has 93 controls. |
| `Control.status` | NIST SP 800-53 Rev.5 §3.1 | not_implemented / partially_implemented / implemented / not_applicable. |

### Integration / evidence collection

| Column | Source | Notes |
| --- | --- | --- |
| `Integration.id` (slug) | Implementation choice | Human-readable slugs like `"aws"`, `"github"`, `"okta"`. Stored where every other product stores a UUID; same idea, different representation. |
| `IntegrationConnection.status` | SOC 2 CC7.1, ISO/IEC 27001 A.5.23 | Connection-health tracking for monitored controls. |
| `SecretVault.algorithm` | NIST SP 800-38D | AES-GCM is the published authenticated-encryption mode. |
| `SecretVault.keyVersion` | NIST SP 800-57 Part 1 Rev.5 §5.3.5 | Key-rotation generation counter. |
| `SecretVault.iv` / `authTag` | NIST SP 800-38D §5.2.1.1 | 96-bit IV and 128-bit tag are mandated by the standard. |
| `SyncLog.status` | SOC 2 CC7.2 operational logging | success / failed outcome of a collection sync. |

### MongoDB documents

| Collection / Field | Source | Notes |
| --- | --- | --- |
| `AuditLog.action` | NIST SP 800-92 §3.2 | Audit log "event type" field. |
| `AuditLog.ipAddress`, `userAgent` | NIST SP 800-92 §4.2 | Required audit-log attribution fields. |
| `EvidenceDocument.collectedAt` | SOC 2 CC4.1 evidence collection | Timestamp at which evidence was produced. |
| `EvidenceDocument.expiresAt` | SOC 2 CC4.1, ISO/IEC 27001 A.5.36 | Time-bound evidence (e.g. quarterly access reviews). |
| `ComplianceSnapshot.overallScore` | Internal — see "% complete" definition. | Percentage of satisfied requirements within a framework instance. |
| `SecurityFinding.severity` | OWASP Risk Rating Methodology | critical / high / medium / low. |

### Generic columns (not interesting from an IP standpoint)

The following appear on most/all tenant-scoped models and are dictated by the ORM rather than any compliance standard. They are listed once here so they don't need to be cited table-by-table:

- `id` (UUID primary key)
- `createdAt`, `updatedAt` (timestamps)
- `tenantId` (multi-tenancy FK — already cited under "Tenancy and identity")
- `name`, `slug`, `description` (display fields)
- `isActive` (soft-disable flag)
- `metadata` / `config` (JSON catch-all for forward compatibility)

---

## Why this matters

Compliance products converge on similar schemas because the underlying control frameworks demand it. ISO 27005's exact word for "likelihood × impact" is "level of risk" (§8.4) — every project that respects that standard will end up with a similarly-named numeric column. Renaming for the sake of differentiation would actively work against the auditors who use the product, because the column would no longer line up with the control they are evidencing.

The renames documented here (e.g. `Organization` → `Tenant`, `encryptedCredentials` → `SecretVault.ciphertext`, `IntegrationProvider` → `Integration`) were made to _better_ align with the published standards and with the rest of the SaaS industry — not to disguise existing similarities.

---

## How to update this document

1. When you add a new domain model, add a row to the relevant section above and cite the standard the column derives from. If no standard prescribes the name, drop it under "Generic columns" or explain the in-house naming choice.
2. When you _remove_ a column, leave its row in place with a strikethrough for one release cycle so the rename history stays discoverable.
3. The CI script `scripts/check-schema-design-intent.ts` (forthcoming) will enforce that every tenant-scoped Prisma model is referenced from this doc at least once.
