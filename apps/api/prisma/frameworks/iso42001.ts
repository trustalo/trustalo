import type { FrameworkDef } from "./index.js";

/**
 * ISO/IEC 42001:2023 — AI Management System (AIMS)
 * Source: ISO/IEC 42001:2023 "Information technology — Artificial intelligence
 *   — Management system", first edition (December 2023)
 *   https://www.iso.org/standard/81230.html
 *
 * Structure:
 *   Clauses 4–10 — High-Level Structure (HLS) management-system clauses
 *     identical in shape to the ones in ISO 27001 / 22301 (context,
 *     leadership, planning, support, operation, performance evaluation,
 *     improvement) but tailored to AI systems and their risks.
 *   Annex A.2–A.10 — AI-specific controls covering policy, governance,
 *     resources, impact assessment, lifecycle, data quality, transparency,
 *     use-time controls and third-party / customer responsibilities.
 *     Annex A is normative for AIMS conformity claims. We model each of
 *     the 38 individual sub-controls (A.2.2 – A.10.4) rather than just the
 *     nine parent categories, so an AIMS auditor can map evidence to the
 *     specific control numbers cited in conformity assessments and in EU
 *     AI Act Article-9 / Annex-IV cross-walks.
 *
 * Identifier scheme: official clause / Annex-A control number
 * (e.g. `4.1`, `8.2`, `A.6.2.4`). Stable across the published standard;
 * we re-seed if ISO publishes an amendment that renumbers controls.
 *
 * Description style: paraphrases the official outcome statement in the
 * outcome-focused tone used in the ISO 27001 entries, sitting close to
 * the standard's "shall" language without reproducing the proprietary
 * text verbatim. Evidence guidance lists the artifacts an AIMS auditor
 * would request to test design and operating effectiveness.
 */
export const ISO42001_FRAMEWORK: FrameworkDef = {
  name: "ISO/IEC 42001:2023",
  version: "2023",
  description:
    "Information technology — Artificial intelligence — Management system. Establishes requirements for an AI Management System (AIMS) covering AI policy, risk and impact assessment, AI system lifecycle, data, transparency, use-time controls and third-party relationships.",
  frameworkType: "iso42001",
  requirements: [
    // ── Clause 4 — Context of the Organization ───────────────────────────
    {
      identifier: "4.1",
      title: "Understanding the organization and its context (AI)",
      category: "Context of the Organization",
      description:
        "The organization shall determine external and internal issues — including AI-specific factors such as societal impact, regulatory expectations and the role of AI in achieving objectives — that are relevant to the purpose of the AI management system and that affect its ability to achieve intended outcomes.",
      evidenceGuidance:
        "Documented context analysis covering AI uses and intended outcomes; PESTLE / horizon-scanning notes on AI regulation; SWOT covering AI capabilities and ethical considerations; periodic management review minutes referencing context updates.",
    },
    {
      identifier: "4.2",
      title: "Understanding the needs and expectations of interested parties (AI)",
      category: "Context of the Organization",
      description:
        "The organization shall identify interested parties relevant to the AI management system — including users, regulators, employees, affected groups and society — and determine which of their requirements relating to AI it has to meet.",
      evidenceGuidance:
        "Stakeholder register covering AI users, data subjects, affected communities and regulators; documented requirements (legal, contractual, ethical) per stakeholder; engagement records.",
    },
    {
      identifier: "4.3",
      title: "Determining the scope of the AIMS",
      category: "Context of the Organization",
      description:
        "The organization shall determine the boundaries and applicability of the AI management system, considering its role in the AI value chain (AI provider, developer, deployer, user) and the AI systems in scope, and shall make the scope available as documented information.",
      evidenceGuidance:
        "Approved AIMS scope statement listing AI systems, business units and value-chain roles in/out of scope; rationale for exclusions; published scope document.",
    },
    {
      identifier: "4.4",
      title: "AI management system",
      category: "Context of the Organization",
      description:
        "The organization shall establish, implement, maintain and continually improve an AI management system, including the processes needed and their interactions, in accordance with the requirements of this document.",
      evidenceGuidance:
        "AIMS manual / process map; documented procedures; control list mapped to ISO 42001 clauses and Annex A; integration map showing interactions with QMS / ISMS / privacy programs.",
    },

    // ── Clause 5 — Leadership ────────────────────────────────────────────
    {
      identifier: "5.1",
      title: "Leadership and commitment (AI)",
      category: "Leadership",
      description:
        "Top management shall demonstrate leadership and commitment with respect to the AI management system by ensuring the AI policy and objectives are established, integrating AIMS requirements into business processes, providing resources and promoting continual improvement.",
      evidenceGuidance:
        "Board / executive minutes endorsing the AIMS; signed AI policy; resource-allocation evidence (budget, headcount); AIMS objectives reported to senior management.",
    },
    {
      identifier: "5.2",
      title: "AI policy",
      category: "Leadership",
      description:
        "Top management shall establish an AI policy appropriate to the organization's purpose that provides a framework for setting AI objectives, includes a commitment to satisfy applicable requirements, and addresses responsible development and use of AI.",
      evidenceGuidance:
        "Approved AI policy with version history; principles addressing fairness, transparency, accountability and safety; distribution and acknowledgment records; review schedule.",
    },
    {
      identifier: "5.3",
      title: "Roles, responsibilities and authorities (AI)",
      category: "Leadership",
      description:
        "Top management shall ensure that the responsibilities and authorities for roles relevant to the AI management system are assigned and communicated, including reporting on AIMS performance to top management.",
      evidenceGuidance:
        "RACI matrix for AI governance, model owners, AI risk officer; documented role descriptions; appointment letters; reporting lines diagram including AI ethics committee or equivalent.",
    },

    // ── Clause 6 — Planning ──────────────────────────────────────────────
    {
      identifier: "6.1",
      title: "Actions to address risks and opportunities (AI)",
      category: "Planning",
      description:
        "When planning for the AI management system, the organization shall determine risks and opportunities — including AI-specific risks to people, society and the organization — that need to be addressed, and shall plan actions to address them and integrate the actions into AIMS processes.",
      evidenceGuidance:
        "AI risk and opportunity register; risk treatment plans; methodology document covering AI-specific harms (bias, safety, privacy, security); integration evidence with enterprise risk management.",
    },
    {
      identifier: "6.2",
      title: "AI objectives and planning to achieve them",
      category: "Planning",
      description:
        "The organization shall establish AI objectives at relevant functions and levels that are consistent with the AI policy, measurable where practicable, monitored and updated, and shall plan how to achieve them — including resources, responsibilities and timelines.",
      evidenceGuidance:
        "AI objectives document with KPIs; project plans linking objectives to delivery milestones; periodic objective-tracking reports; updates following management review.",
    },

    // ── Clause 7 — Support ───────────────────────────────────────────────
    {
      identifier: "7.1",
      title: "Resources (AI)",
      category: "Support",
      description:
        "The organization shall determine and provide the resources needed for the establishment, implementation, maintenance and continual improvement of the AI management system, including specialised AI expertise, data and computing infrastructure.",
      evidenceGuidance:
        "Resource plan covering people, data, compute and tools; budget evidence; capacity plans for training/inference workloads; data-acquisition records.",
    },
    {
      identifier: "7.2",
      title: "Competence (AI)",
      category: "Support",
      description:
        "The organization shall determine the necessary competence of persons doing work under its control that affects AI performance, ensure those persons are competent on the basis of education, training or experience, and retain documented information as evidence of competence.",
      evidenceGuidance:
        "Skills matrix for AI roles (ML engineering, data science, AI ethics, MLOps); training records; certifications; competence assessments and gap-closure plans.",
    },
    {
      identifier: "7.3",
      title: "Awareness (AI)",
      category: "Support",
      description:
        "Persons doing work under the organization's control shall be aware of the AI policy, their contribution to the effectiveness of the AIMS, and the implications of not conforming with AIMS requirements, including AI-specific obligations.",
      evidenceGuidance:
        "AI awareness training materials; completion records; tailored briefings for product teams using AI; awareness reinforcement via newsletters / town halls.",
    },
    {
      identifier: "7.4",
      title: "Communication (AI)",
      category: "Support",
      description:
        "The organization shall determine internal and external communications relevant to the AI management system — including what, when, with whom and how to communicate — covering AI policy, objectives, risks and incidents.",
      evidenceGuidance:
        "Communication plan covering AI stakeholders; sample customer-facing AI disclosures; incident communication templates; channel inventory and approval workflow.",
    },
    {
      identifier: "7.5",
      title: "Documented information (AI)",
      category: "Support",
      description:
        "The AI management system shall include documented information required by ISO 42001 and other documented information determined by the organization as necessary, controlled to ensure availability, suitability and protection.",
      evidenceGuidance:
        "Document control register; version history; access controls and retention rules; sample procedure documents; record of distribution and approvals.",
    },

    // ── Clause 8 — Operation ─────────────────────────────────────────────
    {
      identifier: "8.1",
      title: "Operational planning and control (AI)",
      category: "Operation",
      description:
        "The organization shall plan, implement and control the processes needed to meet AIMS requirements and implement the actions determined in clause 6, including processes for AI development, deployment, operation, monitoring and decommissioning.",
      evidenceGuidance:
        "Documented AI operating procedures; AI lifecycle process map; release / change controls for AI systems; deviation and exception register.",
    },
    {
      identifier: "8.2",
      title: "AI risk assessment",
      category: "Operation",
      description:
        "The organization shall perform AI risk assessments at planned intervals or when significant changes occur, identifying risks to individuals, groups and society as well as to the organization, and shall produce documented assessment results.",
      evidenceGuidance:
        "AI risk assessment methodology; per-system risk reports; risk-trigger criteria; reassessment cadence (e.g. before deployment, after material change, annually).",
    },
    {
      identifier: "8.3",
      title: "AI risk treatment",
      category: "Operation",
      description:
        "The organization shall apply an AI risk treatment process to select appropriate options, determine controls to be implemented (including those from Annex A), and produce a Statement of Applicability and a risk treatment plan.",
      evidenceGuidance:
        "Statement of Applicability listing Annex A controls; risk treatment plan with owners and dates; residual-risk acceptance records; mapping of treatments to risks.",
    },
    {
      identifier: "8.4",
      title: "AI system impact assessment",
      category: "Operation",
      description:
        "The organization shall assess potential consequences of AI systems on individuals, groups and society — including fairness, safety, privacy, security and human oversight — and shall document and act on the results across the AI lifecycle.",
      evidenceGuidance:
        "AI impact assessment template covering affected populations and harm types; completed assessments per system; mitigations linked back into design; refresh triggers (e.g. new use case, data drift).",
    },

    // ── Clause 9 — Performance Evaluation ────────────────────────────────
    {
      identifier: "9.1",
      title: "Monitoring, measurement, analysis and evaluation (AI)",
      category: "Performance Evaluation",
      description:
        "The organization shall determine what needs to be monitored and measured for the AI management system — including AI performance, fairness, safety and compliance — and analyse and evaluate the results to assess AIMS effectiveness.",
      evidenceGuidance:
        "AIMS metrics dashboard (model performance, drift, bias, incident counts); measurement methodology; analysis reports; corrective-action triggers based on thresholds.",
    },
    {
      identifier: "9.2",
      title: "Internal audit (AI)",
      category: "Performance Evaluation",
      description:
        "The organization shall conduct internal audits at planned intervals to confirm that the AI management system conforms to the organization's own requirements and to ISO 42001, and is effectively implemented and maintained.",
      evidenceGuidance:
        "Approved internal audit programme covering AIMS; audit schedule and reports; nonconformity register; auditor independence and competence evidence.",
    },
    {
      identifier: "9.3",
      title: "Management review (AI)",
      category: "Performance Evaluation",
      description:
        "Top management shall review the AI management system at planned intervals to ensure its continuing suitability, adequacy and effectiveness, considering changes in context, AI risks, performance and improvement opportunities.",
      evidenceGuidance:
        "Management review minutes covering AIMS inputs (audit results, KPIs, risks, stakeholder feedback) and outputs (decisions, resource changes); review cadence in policy.",
    },

    // ── Clause 10 — Improvement ──────────────────────────────────────────
    {
      identifier: "10.1",
      title: "Continual improvement (AI)",
      category: "Improvement",
      description:
        "The organization shall continually improve the suitability, adequacy and effectiveness of the AI management system based on AIMS performance data, audit findings, management review outputs and lessons learned from AI incidents.",
      evidenceGuidance:
        "Continual improvement plan; improvement backlog tied to AIMS metrics; closed corrective actions; trend analysis demonstrating improvement over time.",
    },
    {
      identifier: "10.2",
      title: "Nonconformity and corrective action (AI)",
      category: "Improvement",
      description:
        "When a nonconformity occurs in the AI management system, the organization shall react to it, evaluate the need for action to eliminate the root cause, implement corrective actions, and review their effectiveness.",
      evidenceGuidance:
        "Nonconformity register with root-cause analysis; corrective-action plans; effectiveness verification records; trend analysis of repeat nonconformities.",
    },

    // ╔══════════════════════════════════════════════════════════════════╗
    // ║ Annex A — AI-specific Controls (38 sub-controls)                 ║
    // ╚══════════════════════════════════════════════════════════════════╝

    // ── A.2 Policies related to AI ──────────────────────────────────────
    {
      identifier: "A.2.2",
      title: "AI policy",
      category: "AI Policies",
      description:
        "The organization shall document and approve an AI policy that establishes its commitment to the responsible development, deployment and use of AI, including high-level principles, scope and objectives that align with the organization's overall strategy.",
      evidenceGuidance:
        "Approved AI policy with version history and top-management sign-off; published location accessible to all relevant personnel; explicit statement of in-scope AI systems and excluded uses; alignment statements with ethics / privacy / security policies.",
    },
    {
      identifier: "A.2.3",
      title: "Alignment with other organizational policies",
      category: "AI Policies",
      description:
        "The organization shall ensure the AI policy is consistent with other organizational policies (including information security, privacy, ethics, HR, procurement and risk management) and shall update related policies where AI-specific risks are introduced.",
      evidenceGuidance:
        "Policy mapping matrix between AI policy and adjacent policies; change log showing reciprocal updates after the AI policy was issued; cross-references inside policy text; policy review committee with privacy / security / legal representation.",
    },
    {
      identifier: "A.2.4",
      title: "Review of the AI policy",
      category: "AI Policies",
      description:
        "The AI policy shall be reviewed at planned intervals and when significant changes occur in the organization's AI activities, regulatory environment or interested-party expectations, with review outcomes documented.",
      evidenceGuidance:
        "Review schedule (typically annual); review meeting minutes; trigger criteria for ad-hoc reviews (e.g. EU AI Act milestones, major incident); approved revisions with diffs; communications of updates to affected teams.",
    },

    // ── A.3 Internal organization ───────────────────────────────────────
    {
      identifier: "A.3.2",
      title: "AI roles and responsibilities",
      category: "AI Internal Organization",
      description:
        "Roles, responsibilities and authorities for AI development, deployment and oversight shall be defined, allocated and communicated within the organization, including explicit accountability for AI risk management and ethical considerations.",
      evidenceGuidance:
        "RACI matrix for AI activities; appointment letters for AI ethics committee / AI risk owners / model owners; job descriptions referencing AI responsibilities; organisational chart showing AI governance reporting lines to the board or executive.",
    },
    {
      identifier: "A.3.3",
      title: "Reporting of concerns",
      category: "AI Internal Organization",
      description:
        "The organization shall implement a process by which personnel and other interested parties can raise concerns about its AI systems and activities, with protection from retaliation for those who raise concerns in good faith.",
      evidenceGuidance:
        "AI-specific whistleblower or concern-raising channel; published procedure; non-retaliation policy; concerns register with anonymised samples; documented triage, investigation and resolution workflow.",
    },

    // ── A.4 Resources for AI systems ────────────────────────────────────
    {
      identifier: "A.4.2",
      title: "Resource documentation",
      category: "AI Resources",
      description:
        "The organization shall identify and document the resources needed for each phase of the AI system life cycle — including data, tooling, computing, system components and human expertise — and shall keep that documentation current.",
      evidenceGuidance:
        "Resource plan per AI system; AI asset register; mapping of resources to lifecycle phases (development, deployment, operation, retirement); periodic resource review records.",
    },
    {
      identifier: "A.4.3",
      title: "Data resources",
      category: "AI Resources",
      description:
        "The organization shall identify, document and manage data resources used in AI systems, addressing source, quality, representativeness, access controls and lifecycle from acquisition through retention or disposal.",
      evidenceGuidance:
        "Data inventory / catalogue scoped to AI; dataset documentation (datasheets) per dataset; data quality SLAs; data access matrix; retention and disposal schedule per dataset class.",
    },
    {
      identifier: "A.4.4",
      title: "Tooling resources",
      category: "AI Resources",
      description:
        "The organization shall identify and manage the tools used to develop, deploy and operate AI systems — including model training frameworks, MLOps platforms, evaluation tooling and monitoring stacks — with controls appropriate to their criticality.",
      evidenceGuidance:
        "AI tooling inventory; tooling lifecycle policy (procurement, hardening, upgrade); SBOM for AI development tooling; supplier risk assessments for ML platforms; tool-change approval workflow.",
    },
    {
      identifier: "A.4.5",
      title: "System and computing resources",
      category: "AI Resources",
      description:
        "The organization shall identify and manage the system and computing resources used by AI systems — including compute capacity, accelerators (GPUs/TPUs), storage and networking — with consideration of cost, sustainability and performance.",
      evidenceGuidance:
        "Compute capacity plan; utilisation dashboards; cost / carbon tracking per training or inference workload; hardware refresh cycle; documented procurement of AI accelerator resources.",
    },
    {
      identifier: "A.4.6",
      title: "Human resources",
      category: "AI Resources",
      description:
        "The organization shall ensure adequate human resources are available throughout the AI system life cycle, including the required skills, training and competencies for development, deployment, oversight and operation.",
      evidenceGuidance:
        "AI competency framework; training plan covering AI ethics / safety / technical skills; recruitment plan for AI roles; training completion records; competency assessment evidence per role.",
    },

    // ── A.5 Assessing impacts of AI systems ─────────────────────────────
    {
      identifier: "A.5.2",
      title: "AI system impact assessment process",
      category: "AI Impact Assessment",
      description:
        "The organization shall establish a process for assessing the potential impacts of AI systems on individuals, groups and society, with criteria for when assessments are required and how their results are integrated into decisions about each AI system.",
      evidenceGuidance:
        "AI impact assessment (AIA) procedure; trigger criteria (e.g. high-risk classification, new processing of sensitive data); template covering individual / group / societal impact dimensions; integration with risk management workflow; quality review of completed assessments.",
    },
    {
      identifier: "A.5.3",
      title: "Documentation of AI system impact assessments",
      category: "AI Impact Assessment",
      description:
        "AI system impact assessments shall be documented in a manner that allows their results to be communicated to relevant interested parties and used as input to risk management and the AI system life cycle.",
      evidenceGuidance:
        "AIA register; completed AIA records per AI system; version history showing reassessment after material change; published summaries where appropriate; retention period defined for AIA records.",
    },
    {
      identifier: "A.5.4",
      title: "Assessing AI system impact on individuals or groups",
      category: "AI Impact Assessment",
      description:
        "The organization shall assess potential impacts of AI systems on individuals or groups of individuals — including fundamental rights, fairness, non-discrimination, privacy and autonomy — and use the results to inform mitigation and design decisions.",
      evidenceGuidance:
        "Bias / fairness analyses per system; affected-population mapping; DPIA outputs where personal data are processed; mitigation register for identified harms; review by ethics / legal / DPO.",
    },
    {
      identifier: "A.5.5",
      title: "Assessing societal impacts of AI systems",
      category: "AI Impact Assessment",
      description:
        "The organization shall consider broader societal impacts of AI systems — including economic, environmental, cultural and democratic impacts — particularly for systems with wide scope or large-scale deployment.",
      evidenceGuidance:
        "Societal-impact dimension in AIA template; consultation records with civil society / academia where applicable; sustainability impact analysis (compute footprint); published transparency reports.",
    },

    // ── A.6 AI system life cycle ────────────────────────────────────────
    {
      identifier: "A.6.1.2",
      title: "Objectives for responsible development of AI system",
      category: "AI System Life Cycle",
      description:
        "The organization shall define objectives for the responsible development of AI systems — including safety, robustness, fairness, transparency and accountability — and shall communicate them to development teams.",
      evidenceGuidance:
        "Responsible-AI objectives published per AI system or programme; documented trade-off decisions; alignment statement with the AI policy; OKRs / metrics targeting these objectives.",
    },
    {
      identifier: "A.6.1.3",
      title: "Processes for responsible design and development of AI systems",
      category: "AI System Life Cycle",
      description:
        "The organization shall implement processes for the responsible design and development of AI systems, integrating responsible-AI considerations into design choices, model selection, training procedures and acceptance criteria.",
      evidenceGuidance:
        "Responsible-AI design checklist; model card / system card templates; design review minutes including ethics review; training procedure documentation including data choices and hyperparameters.",
    },
    {
      identifier: "A.6.2.2",
      title: "Requirements and specification",
      category: "AI System Life Cycle",
      description:
        "Requirements and specifications for AI systems shall be documented — including functional, non-functional, safety, security, privacy and fairness requirements — with traceability between requirements and design decisions.",
      evidenceGuidance:
        "AI system requirements specification; traceability matrix; specification reviews; defined acceptance criteria; sign-off by product / risk / legal stakeholders.",
    },
    {
      identifier: "A.6.2.3",
      title: "Documentation of AI system design and development",
      category: "AI System Life Cycle",
      description:
        "Design and development activities of AI systems shall be documented to a level that allows reviewers to understand the design choices, data, model architecture and training process, and to reproduce the results.",
      evidenceGuidance:
        "Design documents; model cards covering architecture, training data and hyperparameters; reproducibility artefacts (random seeds, training configs, environment specs); peer review records.",
    },
    {
      identifier: "A.6.2.4",
      title: "Verification and validation of AI system",
      category: "AI System Life Cycle",
      description:
        "AI systems shall be subject to verification and validation activities throughout development, including testing for functional correctness, robustness, fairness, security and conformity to specified requirements.",
      evidenceGuidance:
        "Test plan covering V&V dimensions; evaluation reports including held-out test sets; bias / robustness / adversarial test results; coverage metrics; sign-off against acceptance criteria.",
    },
    {
      identifier: "A.6.2.5",
      title: "Deployment of AI system",
      category: "AI System Life Cycle",
      description:
        "Deployment of AI systems shall follow a defined procedure that includes pre-deployment checks, controlled rollout, rollback capability and post-deployment monitoring setup.",
      evidenceGuidance:
        "Deployment runbook; canary / staged rollout records; rollback procedure tested before go-live; pre-deployment checklist completed; monitoring and alerting configured before traffic cut-over.",
    },
    {
      identifier: "A.6.2.6",
      title: "AI system operation and monitoring",
      category: "AI System Life Cycle",
      description:
        "AI systems in operation shall be monitored to detect changes in performance, drift, errors, unsafe outputs and operational anomalies, with triggers and procedures for intervention, retraining or decommissioning.",
      evidenceGuidance:
        "Monitoring dashboards covering performance / drift / fairness / safety; alert thresholds and on-call runbook; incident tickets resulting from monitoring; retraining decision log; documented intervention procedures.",
    },
    {
      identifier: "A.6.2.7",
      title: "Technical documentation",
      category: "AI System Life Cycle",
      description:
        "Technical documentation of AI systems shall be created and maintained covering design, development, evaluation, deployment and operation, sufficient to support audits, regulatory inquiries and downstream user assurance.",
      evidenceGuidance:
        "Technical file per AI system aligned to applicable regulation (e.g. EU AI Act Annex IV); version-controlled documentation repository; sample audit-ready package; published change log.",
    },
    {
      identifier: "A.6.2.8",
      title: "AI system recording of event logs",
      category: "AI System Life Cycle",
      description:
        "AI systems shall record event logs of operations relevant to safety, security and accountability — including inputs / outputs of consequential decisions, user interactions and significant configuration changes — with retention and protection appropriate to the system's risk profile.",
      evidenceGuidance:
        "Logging policy specifying events recorded per system; log retention schedule; integrity protections (write-once, signed logs); sample log review reports; access controls on log stores.",
    },

    // ── A.7 Data for AI systems ─────────────────────────────────────────
    {
      identifier: "A.7.2",
      title: "Data for development and enhancement of AI system",
      category: "AI Data Management",
      description:
        "The organization shall identify the data needed for development and enhancement of AI systems — including training, validation and test data — and shall document the source, processing and intended use of that data.",
      evidenceGuidance:
        "Dataset register tagged by role (train / val / test); data sourcing documentation; data processing pipelines documented; dataset versioning; intended-use statement per dataset.",
    },
    {
      identifier: "A.7.3",
      title: "Acquisition of data",
      category: "AI Data Management",
      description:
        "Data acquired for AI systems shall be obtained through methods that are lawful, ethical and consistent with the organization's policies, including verification of any rights, licences or consents required for the intended use.",
      evidenceGuidance:
        "Data acquisition policy; supplier / source due diligence records; data licence register; consent verification for personal data; copyright / IP review for scraped or licensed training data.",
    },
    {
      identifier: "A.7.4",
      title: "Quality of data for AI systems",
      category: "AI Data Management",
      description:
        "The quality of data used in AI systems shall be assessed and managed in line with the system's intended use, including dimensions such as accuracy, completeness, representativeness, timeliness and balance.",
      evidenceGuidance:
        "Data quality dimensions defined per dataset; quality metrics and thresholds; data quality reports; remediation actions for quality issues; data quality reviews aligned to model retraining cadence.",
    },
    {
      identifier: "A.7.5",
      title: "Data provenance",
      category: "AI Data Management",
      description:
        "The provenance of data used in AI systems shall be documented and maintained — including origin, ownership, transformations, intermediate processing and lineage to source datasets — to support reproducibility and accountability.",
      evidenceGuidance:
        "Data lineage diagrams or metadata; transformation pipeline documentation; provenance records preserved with each dataset version; SBOM-style data manifest for training datasets.",
    },
    {
      identifier: "A.7.6",
      title: "Data preparation",
      category: "AI Data Management",
      description:
        "Data preparation activities for AI systems — including cleaning, transformation, labelling, augmentation and feature engineering — shall be documented, reviewed and aligned with the intended use of the AI system.",
      evidenceGuidance:
        "Preprocessing pipeline code and documentation; labelling procedures and inter-annotator agreement metrics; sampling and augmentation procedures documented; review of preparation choices for bias impact.",
    },

    // ── A.8 Information for interested parties ──────────────────────────
    {
      identifier: "A.8.2",
      title: "System documentation and information for users",
      category: "AI Information for Interested Parties",
      description:
        "The organization shall provide documentation and information to users of AI systems sufficient for the user to understand the system's intended use, capabilities, limitations and operating conditions, and to use the system responsibly.",
      evidenceGuidance:
        "User-facing model / system cards; product documentation including intended use, limitations and prohibited uses; release notes per model version; user training materials.",
    },
    {
      identifier: "A.8.3",
      title: "External reporting",
      category: "AI Information for Interested Parties",
      description:
        "The organization shall report to external parties (regulators, customers, the public) information about AI systems as required by law, contract or organizational commitments, including conformity assessments, transparency reports and notifications.",
      evidenceGuidance:
        "Regulatory reporting register (e.g. EU AI Act conformity, US state-level disclosures); customer-facing trust reports; published transparency reports; archived conformity-assessment artefacts.",
    },
    {
      identifier: "A.8.4",
      title: "Communication of incidents",
      category: "AI Information for Interested Parties",
      description:
        "The organization shall communicate AI system incidents to affected interested parties — including regulators, customers and end users — in line with statutory, contractual and policy obligations, with timeliness commensurate with the incident's impact.",
      evidenceGuidance:
        "AI incident response plan with communication SLAs per audience; published incident postmortems for material incidents; archived regulator notifications; customer breach / incident communications.",
    },
    {
      identifier: "A.8.5",
      title: "Information for interested parties",
      category: "AI Information for Interested Parties",
      description:
        "The organization shall provide information about its AI activities to other interested parties (investors, partners, civil society, employees) appropriate to the parties' interests and the organization's accountability commitments.",
      evidenceGuidance:
        "Stakeholder-engagement plan; AI annual / sustainability report; investor disclosures on AI strategy and risk; employee briefings on AI use and impacts.",
    },

    // ── A.9 Use of AI systems ───────────────────────────────────────────
    {
      identifier: "A.9.2",
      title: "Processes for responsible use of AI systems",
      category: "AI Use",
      description:
        "The organization shall implement processes for the responsible use of AI systems within the organization, including controls on intended use, human oversight, output review and escalation paths for unexpected behaviour.",
      evidenceGuidance:
        "Responsible AI use procedure; human-in-the-loop design per use case; escalation runbook for anomalous outputs; usage monitoring evidence; periodic use reviews.",
    },
    {
      identifier: "A.9.3",
      title: "Objectives for responsible use of AI system",
      category: "AI Use",
      description:
        "Objectives for the responsible use of each AI system shall be defined and communicated to users, including acceptable purposes, performance expectations and limits of authorised use.",
      evidenceGuidance:
        "Use-objective statement per AI system; acceptable-use policy for AI; user acknowledgments; alignment with system documentation; review records when objectives change.",
    },
    {
      identifier: "A.9.4",
      title: "Intended use of the AI system",
      category: "AI Use",
      description:
        "The intended use of each AI system shall be defined, communicated and enforced, including the operational context, target users, prohibited uses and conditions under which the system is or is not fit for use.",
      evidenceGuidance:
        "Intended-use specification per AI system; enforcement controls (technical or contractual) for prohibited uses; out-of-distribution detection; sample reviews of misuse incidents and responses.",
    },

    // ── A.10 Third-party and customer relationships ─────────────────────
    {
      identifier: "A.10.2",
      title: "Allocation of responsibilities",
      category: "AI Third-party Relationships",
      description:
        "Responsibilities for AI-related controls shall be allocated and documented between the organization and its third parties and customers, particularly where multiple actors contribute to the AI system across its life cycle.",
      evidenceGuidance:
        "Responsibility / RACI matrix across providers, deployers and users; contractual flow-down of AI obligations; published shared-responsibility documentation; alignment with EU AI Act actor responsibilities where applicable.",
    },
    {
      identifier: "A.10.3",
      title: "Suppliers",
      category: "AI Third-party Relationships",
      description:
        "The organization shall manage AI-related risks in its supplier relationships — including providers of AI systems, components, models, datasets and tooling — through due diligence, contractual obligations and ongoing monitoring.",
      evidenceGuidance:
        "AI supplier register; AI-specific contract clauses (model use, data, indemnities, model-evaluation rights); due-diligence assessments including security and ethics; ongoing supplier review evidence.",
    },
    {
      identifier: "A.10.4",
      title: "Customers",
      category: "AI Third-party Relationships",
      description:
        "The organization shall manage AI-related risks in its customer relationships, including communicating the intended use, limitations and responsible-use expectations for AI systems supplied to customers, and supporting customers' assurance needs.",
      evidenceGuidance:
        "Customer-facing AI documentation; AI clauses in customer agreements; assurance package (model cards, evaluation evidence, audit reports); customer escalation and feedback processes.",
    },
  ],
};
