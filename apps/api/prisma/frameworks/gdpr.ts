import type { FrameworkDef } from "./index.js";

/**
 * GDPR control catalog — distilled from the practically-auditable Articles
 * of EU Regulation 2016/679. We deliberately do not encode every recital or
 * the late administrative chapters: the goal is a control catalog at the
 * granularity an auditor would actually walk through, matching the depth of
 * Vanta / Drata / Secureframe GDPR packs (~35 requirements) rather than
 * mechanically expanding all 99 articles.
 *
 * Categories follow the regulation's chapter structure so the UI groups
 * controls naturally (Principles → Rights → Controller/Processor → Transfers
 * → Cooperation).
 */
export const GDPR_FRAMEWORK: FrameworkDef = {
  name: "GDPR",
  version: "2016/679",
  description:
    "EU General Data Protection Regulation — privacy and personal-data protection requirements for controllers and processors handling personal data of EU/EEA data subjects.",
  frameworkType: "gdpr",
  requirements: [
    // ── Chapter II — Principles ────────────────────────────────────────
    {
      identifier: "Art.5(1)(a)",
      title: "Lawfulness, fairness and transparency",
      category: "Principles",
      description:
        "Personal data is processed lawfully, fairly and in a transparent manner in relation to the data subject.",
      evidenceGuidance:
        "Privacy notices, lawful-basis register per processing activity, transparency dashboard.",
    },
    {
      identifier: "Art.5(1)(b)",
      title: "Purpose limitation",
      category: "Principles",
      description:
        "Personal data is collected for specified, explicit and legitimate purposes and not further processed in a manner incompatible with those purposes.",
      evidenceGuidance: "Recorded purpose for each Processing Activity (RoPA).",
    },
    {
      identifier: "Art.5(1)(c)",
      title: "Data minimisation",
      category: "Principles",
      description:
        "Personal data is adequate, relevant and limited to what is necessary in relation to the purposes for which it is processed.",
      evidenceGuidance:
        "Data-minimisation review per processing activity; field-level justification in product designs.",
    },
    {
      identifier: "Art.5(1)(d)",
      title: "Accuracy",
      category: "Principles",
      description:
        "Personal data is accurate and, where necessary, kept up to date; reasonable steps are taken to ensure inaccurate data is erased or rectified.",
      evidenceGuidance: "Rectification workflow (DSAR Art. 16); periodic data-quality reviews.",
    },
    {
      identifier: "Art.5(1)(e)",
      title: "Storage limitation",
      category: "Principles",
      description:
        "Personal data is kept in a form which permits identification of data subjects for no longer than necessary.",
      evidenceGuidance:
        "Documented retention schedules per processing activity; deletion job evidence.",
    },
    {
      identifier: "Art.5(1)(f)",
      title: "Integrity and confidentiality",
      category: "Principles",
      description:
        "Personal data is processed in a manner that ensures appropriate security, including protection against unauthorised or unlawful processing and against accidental loss, destruction or damage.",
      evidenceGuidance:
        "Mapped to ISO 27001 A.5.10 / SOC 2 CC6.* security controls and Art. 32 measures.",
    },
    {
      identifier: "Art.5(2)",
      title: "Accountability",
      category: "Principles",
      description:
        "The controller is responsible for, and must be able to demonstrate compliance with, the principles of Article 5(1).",
      evidenceGuidance: "RoPA, DPIAs, training records, audit log of privacy actions.",
    },
    {
      identifier: "Art.6",
      title: "Lawfulness of processing",
      category: "Principles",
      description:
        "Processing is lawful only if and to the extent that at least one of the six lawful bases under Article 6(1) applies (consent, contract, legal obligation, vital interests, public task, legitimate interests).",
      evidenceGuidance: "Lawful basis recorded against every processing activity.",
    },
    {
      identifier: "Art.7",
      title: "Conditions for consent",
      category: "Principles",
      description:
        "Where processing is based on consent, the controller must be able to demonstrate that the data subject has consented and consent must be freely given, specific, informed, unambiguous and as easy to withdraw as to give.",
      evidenceGuidance: "Consent records with timestamp, scope, withdrawal mechanism.",
    },
    {
      identifier: "Art.8",
      title: "Conditions applicable to a child's consent",
      category: "Principles",
      description:
        "Where the child is below the age of 16 (or lower per Member-State law, not below 13), consent must be given or authorised by the holder of parental responsibility.",
      evidenceGuidance: "Age-gating evidence; parental-consent flow for under-16 services.",
    },
    {
      identifier: "Art.9",
      title: "Special categories of personal data",
      category: "Principles",
      description:
        "Processing of special-category data (health, biometric, racial/ethnic, religious, sexual orientation, etc.) is prohibited unless one of the Art. 9(2) conditions applies.",
      evidenceGuidance:
        "Inventory of special-category processing with cited Art. 9(2) condition; mandatory DPIA.",
    },
    {
      identifier: "Art.10",
      title: "Processing of criminal-offence data",
      category: "Principles",
      description:
        "Processing of personal data relating to criminal convictions and offences is restricted to controls authorised by Union or Member-State law.",
      evidenceGuidance: "Legal-basis citation for each criminal-data processing activity.",
    },

    // ── Chapter III — Rights of the Data Subject ───────────────────────
    {
      identifier: "Art.12",
      title: "Transparent information and modalities for data-subject rights",
      category: "Data-Subject Rights",
      description:
        "Information and communications relating to processing must be provided in a concise, transparent, intelligible and easily accessible form, using clear and plain language. Responses to data-subject requests within one month (extendable by two further months).",
      evidenceGuidance: "DSAR intake form, identity verification step, SLA timer evidence.",
    },
    {
      identifier: "Art.13",
      title: "Information to be provided where personal data are collected from the data subject",
      category: "Data-Subject Rights",
      description:
        "At the time data is obtained, the controller must provide identity, contact details, purposes, lawful basis, recipients, retention, rights, and (where applicable) transfer information.",
      evidenceGuidance: "Direct-collection privacy notice; sign-up flow screenshots.",
    },
    {
      identifier: "Art.14",
      title:
        "Information to be provided where personal data have not been obtained from the data subject",
      category: "Data-Subject Rights",
      description:
        "When data is obtained from a third party, the controller must provide the equivalent Art. 13 information within a reasonable period and in any event within one month.",
      evidenceGuidance: "Indirect-collection notice; third-party data-source register.",
    },
    {
      identifier: "Art.15",
      title: "Right of access by the data subject",
      category: "Data-Subject Rights",
      description:
        "Data subjects have the right to confirmation as to whether personal data is processed and, where so, access to the data and supplementary information.",
      evidenceGuidance: "DSAR (Access) workflow with response artefacts.",
    },
    {
      identifier: "Art.16",
      title: "Right to rectification",
      category: "Data-Subject Rights",
      description:
        "Data subjects have the right to obtain rectification of inaccurate personal data and to have incomplete data completed.",
      evidenceGuidance: "DSAR (Rectification) workflow; downstream propagation evidence.",
    },
    {
      identifier: "Art.17",
      title: "Right to erasure ('right to be forgotten')",
      category: "Data-Subject Rights",
      description:
        "Data subjects have the right to obtain erasure of personal data without undue delay where one of the Art. 17(1) grounds applies.",
      evidenceGuidance: "DSAR (Erasure) workflow with deletion-job evidence and processor cascade.",
    },
    {
      identifier: "Art.18",
      title: "Right to restriction of processing",
      category: "Data-Subject Rights",
      description:
        "Data subjects have the right to obtain restriction of processing in the circumstances listed in Art. 18(1).",
      evidenceGuidance: "Technical mechanism to flag/freeze records; restriction register.",
    },
    {
      identifier: "Art.19",
      title: "Notification obligation regarding rectification, erasure or restriction",
      category: "Data-Subject Rights",
      description:
        "The controller must communicate any rectification, erasure or restriction to each recipient to whom the personal data have been disclosed, unless this proves impossible or involves disproportionate effort.",
      evidenceGuidance: "Recipient-notification log per fulfilled DSAR.",
    },
    {
      identifier: "Art.20",
      title: "Right to data portability",
      category: "Data-Subject Rights",
      description:
        "Data subjects have the right to receive their personal data in a structured, commonly used and machine-readable format and to transmit it to another controller, where processing is based on consent or contract and is carried out by automated means.",
      evidenceGuidance: "DSAR (Portability) export tooling; format documentation.",
    },
    {
      identifier: "Art.21",
      title: "Right to object",
      category: "Data-Subject Rights",
      description:
        "Data subjects have the right to object to processing based on Art. 6(1)(e)/(f), including profiling, and (without justification) to processing for direct marketing.",
      evidenceGuidance: "Objection intake; marketing-suppression list.",
    },
    {
      identifier: "Art.22",
      title: "Automated individual decision-making, including profiling",
      category: "Data-Subject Rights",
      description:
        "Data subjects have the right not to be subject to a decision based solely on automated processing (including profiling) which produces legal or similarly significant effects, unless one of the Art. 22(2) grounds applies.",
      evidenceGuidance: "Inventory of solely-automated decisions; human-review override path.",
    },

    // ── Chapter IV — Controller and Processor ──────────────────────────
    {
      identifier: "Art.24",
      title: "Responsibility of the controller",
      category: "Controller / Processor",
      description:
        "The controller must implement appropriate technical and organisational measures to ensure and demonstrate that processing is performed in accordance with the GDPR.",
      evidenceGuidance: "Privacy policy set; control framework adoption; training records.",
    },
    {
      identifier: "Art.25",
      title: "Data protection by design and by default",
      category: "Controller / Processor",
      description:
        "The controller must implement appropriate technical and organisational measures designed to implement data-protection principles (e.g. data minimisation) and to ensure that, by default, only personal data necessary for each specific purpose are processed.",
      evidenceGuidance: "Design-review checklists; default-private settings evidence.",
    },
    {
      identifier: "Art.26",
      title: "Joint controllers",
      category: "Controller / Processor",
      description:
        "Joint controllers must determine in a transparent manner their respective responsibilities for compliance with the GDPR via an arrangement, the essence of which is made available to data subjects.",
      evidenceGuidance: "Joint-controller arrangements register.",
    },
    {
      identifier: "Art.28",
      title: "Processor",
      category: "Controller / Processor",
      description:
        "Processing by a processor must be governed by a contract (Art. 28(3) DPA) that imposes the GDPR obligations on the processor; the controller must use only processors providing sufficient guarantees.",
      evidenceGuidance:
        "Sub-processor inventory with executed DPAs; periodic processor due diligence.",
    },
    {
      identifier: "Art.30",
      title: "Records of processing activities",
      category: "Controller / Processor",
      description:
        "Each controller (and processor) must maintain a record of processing activities under its responsibility, containing the information set out in Art. 30(1) (controller) or Art. 30(2) (processor).",
      evidenceGuidance:
        "RoPA register kept current; export available on request to supervisory authority.",
    },
    {
      identifier: "Art.32",
      title: "Security of processing",
      category: "Controller / Processor",
      description:
        "Controller and processor must implement appropriate technical and organisational measures to ensure a level of security appropriate to the risk, including pseudonymisation, encryption, ongoing CIA, and resilience.",
      evidenceGuidance:
        "Maps to ISO 27001 Annex A controls and SOC 2 CC6/CC7. Evidence is reused via cross-framework mapping.",
    },
    {
      identifier: "Art.33",
      title: "Notification of a personal data breach to the supervisory authority",
      category: "Breach Management",
      description:
        "In case of a personal-data breach the controller must, without undue delay and where feasible, not later than 72 hours after becoming aware of it, notify the competent supervisory authority — unless the breach is unlikely to result in a risk.",
      evidenceGuidance:
        "Breach register with discovery time, 72-hour clock, notification artefact.",
    },
    {
      identifier: "Art.34",
      title: "Communication of a personal data breach to the data subject",
      category: "Breach Management",
      description:
        "When a breach is likely to result in a high risk to the rights and freedoms of natural persons, the controller must communicate the breach to the data subject without undue delay.",
      evidenceGuidance: "Affected-subject notification template; risk-assessment record.",
    },
    {
      identifier: "Art.35",
      title: "Data protection impact assessment (DPIA)",
      category: "Controller / Processor",
      description:
        "Where a type of processing — in particular using new technologies and taking into account nature, scope, context and purposes — is likely to result in a high risk to rights and freedoms, the controller must carry out a DPIA prior to processing.",
      evidenceGuidance:
        "Completed DPIAs linked to processing activities; prior-consultation record where applicable.",
    },
    {
      identifier: "Art.36",
      title: "Prior consultation",
      category: "Controller / Processor",
      description:
        "The controller must consult the supervisory authority prior to processing where a DPIA indicates that the processing would result in a high risk in the absence of mitigation.",
      evidenceGuidance: "Prior-consultation correspondence with the SA.",
    },
    {
      identifier: "Art.37",
      title: "Designation of the data protection officer (DPO)",
      category: "Controller / Processor",
      description:
        "The controller and processor must designate a DPO where (a) processing is carried out by a public authority, (b) core activities require regular and systematic monitoring of data subjects on a large scale, or (c) core activities involve processing on a large scale of special-category or criminal data.",
      evidenceGuidance: "DPO appointment letter; contact-details publication.",
    },
    {
      identifier: "Art.38",
      title: "Position of the data protection officer",
      category: "Controller / Processor",
      description:
        "The DPO must be involved properly and in a timely manner in all issues relating to the protection of personal data; resourced; and protected from instructions and from dismissal for performing tasks.",
      evidenceGuidance: "DPO charter; reporting line evidence.",
    },
    {
      identifier: "Art.39",
      title: "Tasks of the data protection officer",
      category: "Controller / Processor",
      description:
        "The DPO advises the controller/processor and employees, monitors compliance, advises on DPIAs, cooperates with the supervisory authority, and acts as contact point.",
      evidenceGuidance: "DPO activity report; DPIA review records.",
    },

    // ── Chapter V — Transfers to Third Countries ───────────────────────
    {
      identifier: "Art.44",
      title: "General principle for transfers",
      category: "Transfers",
      description:
        "Any transfer of personal data to a third country or international organisation must take place only if the controller and processor comply with the conditions of Chapter V.",
      evidenceGuidance: "Transfer impact assessments (TIAs); transfer register on RoPA.",
    },
    {
      identifier: "Art.45",
      title: "Transfers on the basis of an adequacy decision",
      category: "Transfers",
      description:
        "Transfers may take place where the European Commission has decided that the third country, territory, sector or international organisation ensures an adequate level of protection.",
      evidenceGuidance: "List of adequacy-decision destinations; periodic re-validation.",
    },
    {
      identifier: "Art.46",
      title: "Transfers subject to appropriate safeguards",
      category: "Transfers",
      description:
        "In the absence of an adequacy decision, transfers may take place only on the basis of appropriate safeguards (Standard Contractual Clauses, Binding Corporate Rules, approved codes of conduct, certification mechanisms).",
      evidenceGuidance:
        "Executed SCCs / BCRs; transfer-mechanism field on RoPA / sub-processor records.",
    },
    {
      identifier: "Art.49",
      title: "Derogations for specific situations",
      category: "Transfers",
      description:
        "In the absence of adequacy or appropriate safeguards, transfers may take place only on one of the derogations listed in Art. 49(1).",
      evidenceGuidance:
        "Derogation-cited transfers documented per occurrence; not used for repetitive transfers.",
    },

    // ── Chapter VI — Cooperation with Supervisory Authorities ──────────
    {
      identifier: "Art.31",
      title: "Cooperation with the supervisory authority",
      category: "Cooperation",
      description:
        "The controller and processor (and where applicable their representatives) must cooperate, on request, with the supervisory authority in the performance of its tasks.",
      evidenceGuidance: "SA correspondence log; designated point of contact.",
    },
  ],
};
