import type { FrameworkDef } from "./index.js";

/**
 * ISO/IEC 27018:2019 — PII Protection in Public Clouds (Processor)
 * Source: ISO/IEC 27018:2019 "Information technology — Security techniques
 *   — Code of practice for protection of personally identifiable information
 *   (PII) in public clouds acting as PII processors", second edition
 *   (January 2019). https://www.iso.org/standard/76559.html
 *
 * Structure:
 *   - Annex A — eleven PII protection principles (A.1 – A.11) derived
 *     from ISO/IEC 29100, expressed as outcomes a public-cloud PII
 *     processor is expected to support.
 *   - Cloud PII processor extensions to ISO/IEC 27002 controls
 *     (identifiers ending `-pii`) covering policies, access management,
 *     cryptography, physical protection, operational procedures, backup,
 *     logging, transfer, breach notification and legal compliance.
 *
 * Identifier scheme:
 *   - `A.<n>` for the eleven PII principles in ISO 27018 Annex A.
 *   - `<27002 clause>-pii` for the PII-specific 27002 control extensions
 *     (e.g. `9.2-pii` for user access management of PII processing).
 *
 * Description style: paraphrases the published outcome statements in
 * the outcome-focused tone used in the ISO 27001 entries — close to
 * the standard's "shall" / "should" language without reproducing the
 * proprietary text verbatim. Evidence guidance lists artifacts a
 * cloud-PII assessor would request (DPAs, sub-processor registers,
 * customer notification logs, key-management policy, etc.).
 */
export const ISO27018_FRAMEWORK: FrameworkDef = {
  name: "ISO/IEC 27018:2019",
  version: "2019",
  description:
    "Code of practice for protection of personally identifiable information (PII) in public clouds acting as PII processors. Adds PII-processor-specific guidance to ISO/IEC 27002 controls and the eleven PII protection principles from ISO/IEC 29100.",
  frameworkType: "iso27018",
  requirements: [
    // ── Annex A — PII Protection Principles ──────────────────────────────
    {
      identifier: "A.1",
      title: "Consent and choice",
      category: "PII Protection Principles",
      description:
        "The public-cloud PII processor shall provide the cloud service customer with the means to allow PII principals to exercise consent and choice regarding the processing of their PII, and shall not use PII for marketing or advertising purposes without express consent.",
      evidenceGuidance:
        "Customer-facing controls for capturing and recording consent; data processing agreements (DPAs) prohibiting marketing use; documented choice mechanisms (opt-in / opt-out) the PII processor exposes to the controller.",
    },
    {
      identifier: "A.2",
      title: "Purpose legitimacy and specification",
      category: "PII Protection Principles",
      description:
        "PII shall only be processed for the purposes documented in the contract with the cloud service customer. The PII processor shall not process PII for any additional purposes that have not been authorised by the cloud service customer.",
      evidenceGuidance:
        "Customer DPAs documenting permitted purposes; internal access policies binding processing to documented purposes; sample audit logs showing processing limited to contracted purpose; change-control evidence for any new purpose request.",
    },
    {
      identifier: "A.3",
      title: "Collection limitation",
      category: "PII Protection Principles",
      description:
        "PII collected by the public-cloud PII processor on behalf of the cloud service customer shall be limited to what is necessary for the purposes specified in the contract.",
      evidenceGuidance:
        "Service description / API documentation listing collected PII fields; data minimisation reviews; configuration options exposed to customers to disable optional PII collection.",
    },
    {
      identifier: "A.4",
      title: "Data minimization",
      category: "PII Protection Principles",
      description:
        "PII processing shall be limited to the minimum necessary for the agreed purposes, and the PII processor shall provide tools and guidance to assist cloud service customers in meeting their data-minimisation obligations.",
      evidenceGuidance:
        "Field-level retention / minimisation features in product; documentation guiding customers on minimisation; periodic reviews of attributes processed; data inventory tagged for minimisation status.",
    },
    {
      identifier: "A.5",
      title: "Use, retention and disclosure limitation",
      category: "PII Protection Principles",
      description:
        "The PII processor shall not use, retain or disclose PII for any purposes other than those specified in the contract with the cloud service customer, and shall provide notice and options before any disclosure required by law.",
      evidenceGuidance:
        "DPA clauses on use / retention / disclosure; published policy on government / law-enforcement requests; transparency report; notification log for legally compelled disclosures (where permitted).",
    },
    {
      identifier: "A.6",
      title: "Accuracy and quality",
      category: "PII Protection Principles",
      description:
        "The PII processor shall provide mechanisms enabling cloud service customers to ensure the accuracy of PII and to correct, amend or delete PII at the request of the PII principal.",
      evidenceGuidance:
        "Customer-accessible APIs / admin tools for PII rectification and deletion; documentation of correction workflows; SLA for honouring correction / deletion requests; sample request tickets with timestamps.",
    },
    {
      identifier: "A.7",
      title: "Openness, transparency and notice",
      category: "PII Protection Principles",
      description:
        "The PII processor shall make publicly available clear and easily accessible information about its policies, procedures and practices regarding the handling of PII, including the categories of PII processed, processing purposes and use of sub-processors.",
      evidenceGuidance:
        "Published privacy policy and processor sub-page; published sub-processor register and notification mechanism for changes; trust portal / data-handling whitepapers.",
    },
    {
      identifier: "A.8",
      title: "Individual participation and access",
      category: "PII Protection Principles",
      description:
        "The PII processor shall provide cloud service customers with the means to enable PII principals to access, correct or erase their PII, in support of the cloud service customer meeting its obligations to PII principals.",
      evidenceGuidance:
        "Customer-facing self-service or admin tooling for DSAR fulfilment; documented procedures for assisting customers with PII principal requests; SLA for responding to access / correction / erasure requests.",
    },
    {
      identifier: "A.9",
      title: "Accountability",
      category: "PII Protection Principles",
      description:
        "The PII processor shall be accountable for compliance with its PII protection commitments, shall designate responsibility for PII protection within the organisation, and shall be able to demonstrate compliance through documented controls and audits.",
      evidenceGuidance:
        "Designated PII protection officer / DPO; PII control owner register; internal and external audit reports (e.g. ISO 27001 + 27018, SOC 2); customer audit / inspection rights exercised.",
    },
    {
      identifier: "A.10",
      title: "Information security",
      category: "PII Protection Principles",
      description:
        "The PII processor shall implement appropriate technical and organisational controls to protect PII against accidental or unlawful destruction, loss, alteration, unauthorised disclosure or access, throughout the PII lifecycle.",
      evidenceGuidance:
        "ISO 27001 ISMS coverage including PII; encryption-at-rest and in-transit configuration; access-control matrix scoped to PII; security incident metrics tagged with PII impact.",
    },
    {
      identifier: "A.11",
      title: "Privacy compliance",
      category: "PII Protection Principles",
      description:
        "The PII processor shall verify and demonstrate, through documented review and audit, that processing of PII complies with applicable data protection legislation, regulatory requirements and contractual obligations.",
      evidenceGuidance:
        "Privacy compliance register (GDPR, CCPA, APPs, LGPD, etc.); legal review records of standard contracts; compliance audit reports; corrective action tracking for findings.",
    },

    // ── Cloud PII Processor Controls (27002 extensions) ──────────────────
    {
      identifier: "5.1-pii",
      title: "Policies for PII protection",
      category: "Cloud PII Processor Controls",
      description:
        "The PII processor shall establish, document and maintain policies for protecting PII processed in the cloud service, addressing PII processor responsibilities, customer obligations and applicable legal and contractual requirements.",
      evidenceGuidance:
        "Approved PII protection policy with version history; policy distribution / acknowledgment records; alignment documentation between PII policy and ISO 27001 ISMS policies; review schedule.",
    },
    {
      identifier: "9.2-pii",
      title: "User access management for PII processing",
      category: "Cloud PII Processor Controls",
      description:
        "The PII processor shall manage user access to systems processing PII so that PII is accessible only to those with a documented business need, including provisioning, periodic review and prompt revocation of access.",
      evidenceGuidance:
        "Joiner / mover / leaver workflow for PII-processing systems; quarterly access reviews of PII roles; segregation-of-duties matrix; access-revocation SLA evidence.",
    },
    {
      identifier: "9.4-pii",
      title: "PII access restrictions",
      category: "Cloud PII Processor Controls",
      description:
        "Access to PII shall be restricted to authorised users via least-privilege controls, with technical enforcement that limits read, write and export operations on PII to those required for documented purposes.",
      evidenceGuidance:
        "Role-based / attribute-based access controls scoped to PII fields; data masking / tokenisation in non-production environments; just-in-time elevation logs; export approval workflow.",
    },
    {
      identifier: "10.1-pii",
      title: "Cryptographic protection of PII",
      category: "Cloud PII Processor Controls",
      description:
        "Cryptographic controls shall be used to protect PII at rest and in transit, with documented key-management practices including key generation, distribution, storage, rotation and revocation appropriate to the sensitivity of the PII.",
      evidenceGuidance:
        "Key management policy; KMS / HSM configuration; encryption-at-rest evidence per data store; TLS configuration; customer-managed key (CMK) / BYOK options where supported; key rotation logs.",
    },
    {
      identifier: "11.1-pii",
      title: "Physical protection of PII processing facilities",
      category: "Cloud PII Processor Controls",
      description:
        "Physical access to facilities used to process PII shall be restricted to authorised personnel through layered physical security controls, including perimeter, entry, server-room and disposal controls.",
      evidenceGuidance:
        "Data centre physical security attestations from upstream provider (SOC 2, ISO 27001 / 27018); badge / biometric access logs; visitor procedures; secure media destruction certificates.",
    },
    {
      identifier: "12.1-pii",
      title: "Operational procedures for PII processing",
      category: "Cloud PII Processor Controls",
      description:
        "The PII processor shall maintain documented operational procedures for handling PII — including configuration, change management, capacity, and segregation of duties — to ensure PII is processed consistently with policies and contractual commitments.",
      evidenceGuidance:
        "Operational runbooks tagged for PII handling; change-management tickets with privacy review; segregation-of-duties matrix; capacity reports for PII-processing systems.",
    },
    {
      identifier: "12.3-pii",
      title: "PII data backup and recovery",
      category: "Cloud PII Processor Controls",
      description:
        "Backup, restoration and disposal procedures for PII shall be defined and tested, ensuring backups are protected to the same level as the source data and that PII is securely removed from backups in line with the retention policy.",
      evidenceGuidance:
        "Backup policy aligned to RPO/RTO; backup encryption configuration; restoration test reports; secure-disposal procedures and certificates; retention schedule covering backups.",
    },
    {
      identifier: "12.4-pii",
      title: "Logging and monitoring of PII processing",
      category: "Cloud PII Processor Controls",
      description:
        "The PII processor shall log access to and operations on PII, monitor logs for unauthorised activity, protect log integrity, and provide cloud service customers with sufficient information to fulfil their accountability obligations.",
      evidenceGuidance:
        "Audit log architecture covering PII access / changes / exports; log-integrity protections (write-once, retention rules); customer-accessible audit log feature / export; SIEM detections for PII anomalies.",
    },
    {
      identifier: "13.2-pii",
      title: "PII transfer policies",
      category: "Cloud PII Processor Controls",
      description:
        "The PII processor shall document the countries in which PII may be processed and shall provide cloud service customers with the means to control international transfers of PII, including the use of recognised transfer mechanisms.",
      evidenceGuidance:
        "Data residency / processing-location documentation; published list of processing regions; SCCs / DPF / IDTA agreements with customers; data-transfer impact assessments.",
    },
    {
      identifier: "16.1-pii",
      title: "PII breach notification",
      category: "Cloud PII Processor Controls",
      description:
        "The PII processor shall promptly notify the cloud service customer of any incident leading to the loss, unauthorised disclosure of, or unauthorised access to PII, providing sufficient detail for the customer to meet its own breach-notification obligations.",
      evidenceGuidance:
        "Incident response plan with defined PII-breach criteria and SLA for customer notification; sample notifications sent; customer-contact register; coordination with regulators where the PII processor is also a controller.",
    },
    {
      identifier: "18.1-pii",
      title: "Legal compliance for PII processing",
      category: "Cloud PII Processor Controls",
      description:
        "The PII processor shall identify and document the legal, regulatory and contractual requirements applicable to its processing of PII, and shall implement controls to demonstrate ongoing compliance with those requirements.",
      evidenceGuidance:
        "PII compliance obligation register (GDPR, CCPA, APPs, HIPAA where applicable); legal-review records of standard contracts; compliance audit / certification reports (ISO 27018, SOC 2 + privacy criteria); corrective-action tracking for findings.",
    },
  ],
};
