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
 *   Annex A.2–A.10 — AI-specific control objectives covering policy,
 *     governance, resources, impact assessment, lifecycle, data quality,
 *     transparency, use-time controls and third-party / customer
 *     responsibilities. Annex A is normative for AIMS conformity claims.
 *
 * Identifier scheme: official clause / Annex-A control number
 * (e.g. `4.1`, `8.2`, `A.6`). Stable across the published standard;
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
    // ║ Annex A — AI-specific Controls                                   ║
    // ╚══════════════════════════════════════════════════════════════════╝
    {
      identifier: "A.2",
      title: "AI policies",
      category: "AI Controls (Annex A)",
      description:
        "The organization shall document and approve policies for the responsible development and use of AI — including ethical, legal and safety requirements — and shall communicate them to interested parties and review them at planned intervals.",
      evidenceGuidance:
        "AI policy set (responsible AI, AI use, AI development, third-party AI); approval records; topic-specific policies (e.g. generative AI use); review schedule and version history.",
    },
    {
      identifier: "A.3",
      title: "Internal organization for AI",
      category: "AI Controls (Annex A)",
      description:
        "The organization shall define an internal structure for AI governance — including roles, decision rights, oversight bodies and escalation paths — to ensure responsible development, deployment and use of AI systems.",
      evidenceGuidance:
        "AI governance charter; AI ethics / risk committee terms of reference; decision-rights matrix; minutes of AI governance meetings; escalation procedure.",
    },
    {
      identifier: "A.4",
      title: "Resources for AI systems",
      category: "AI Controls (Annex A)",
      description:
        "The organization shall identify and document resources required for AI systems — including data, tooling, computing, human expertise and system components — and shall manage them throughout the AI lifecycle.",
      evidenceGuidance:
        "Inventory of AI assets (models, datasets, tooling, compute); resource plans per system; human expertise mapping; data sourcing records.",
    },
    {
      identifier: "A.5",
      title: "Assessing impacts of AI systems",
      category: "AI Controls (Annex A)",
      description:
        "The organization shall assess and document the potential impacts of AI systems on individuals, groups and society — including reasonably foreseeable misuse — and shall use the results to inform the design, deployment and operation of AI systems.",
      evidenceGuidance:
        "AI impact assessments per system; affected-population analysis; misuse / abuse case library; mitigation plans linked to design changes; reassessment triggers.",
    },
    {
      identifier: "A.6",
      title: "AI system life cycle",
      category: "AI Controls (Annex A)",
      description:
        "The organization shall establish processes for the responsible AI system life cycle — covering objectives, design, data acquisition, model development, verification and validation, deployment, operation and decommissioning — with appropriate documentation at each stage.",
      evidenceGuidance:
        "AI lifecycle process map; gate criteria per stage; model cards / system cards; verification and validation reports; decommissioning checklists.",
    },
    {
      identifier: "A.7",
      title: "Data for AI systems",
      category: "AI Controls (Annex A)",
      description:
        "The organization shall manage data used in AI systems — including provenance, quality, representativeness, labelling, privacy and security — to ensure data is appropriate for its intended use across the lifecycle.",
      evidenceGuidance:
        "Data governance policy for AI; dataset documentation (datasheets); data quality reports; bias / representativeness analyses; lineage and provenance records.",
    },
    {
      identifier: "A.8",
      title: "Information for interested parties of AI systems",
      category: "AI Controls (Annex A)",
      description:
        "The organization shall provide information to users and other interested parties about AI systems — including capabilities, limitations, intended uses, and potential impacts — so they can make informed decisions about interacting with the AI system.",
      evidenceGuidance:
        "Published model / system cards; user-facing AI disclosures; documentation of intended and prohibited uses; transparency reports; release notes per model version.",
    },
    {
      identifier: "A.9",
      title: "Use of AI systems",
      category: "AI Controls (Annex A)",
      description:
        "The organization shall implement controls for the responsible use of AI systems — including human oversight, monitoring, decision review and override capability — to ensure AI systems are used in line with their intended purpose and the organization's policies.",
      evidenceGuidance:
        "Human-in-the-loop / oversight procedures; override and rollback capability evidence; monitoring dashboards (drift, performance, abuse); use-policy enforcement records.",
    },
    {
      identifier: "A.10",
      title: "Third-party and customer relationships",
      category: "AI Controls (Annex A)",
      description:
        "The organization shall manage AI-related risks in relationships with third parties and customers — including providers of AI systems, components or data — through contractual obligations, due diligence and ongoing assurance.",
      evidenceGuidance:
        "Third-party AI inventory; AI-specific contract clauses (model use, data, indemnities); due-diligence assessments; ongoing supplier monitoring evidence; customer agreements on AI use.",
    },
  ],
};
