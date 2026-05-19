import type { FrameworkDef } from "./index.js";

/**
 * ISO 22301:2019 — Business Continuity Management Systems (BCMS)
 * Source: ISO 22301:2019 "Security and resilience — Business continuity
 *   management systems — Requirements", second edition (October 2019)
 *   https://www.iso.org/standard/75106.html
 *
 * Structure:
 *   Clauses 4–10 — High-Level Structure (HLS) management-system clauses
 *     covering context, leadership, planning, support, operation
 *     (BIA / risk assessment, strategies, plans, exercise programme,
 *     evaluation), performance evaluation and improvement.
 *
 * Identifier scheme: official clause number (e.g. `4.1`, `8.4`).
 *
 * Description style: paraphrases the published outcome statements in
 * the outcome-focused tone used in ISO 27001 entries — close to the
 * standard's "shall" language without reproducing the proprietary
 * text verbatim. Evidence guidance lists the artifacts a BCMS lead
 * auditor would request to test design and operating effectiveness
 * (BIA workbooks, RTO/RPO sheets, exercise reports, BC plans, etc.).
 */
export const ISO22301_FRAMEWORK: FrameworkDef = {
  name: "ISO 22301:2019",
  version: "2019",
  description:
    "Security and resilience — Business continuity management systems — Requirements. Establishes requirements to plan, establish, implement, operate, monitor, review, maintain and continually improve a BCMS to protect against, reduce the likelihood of, prepare for, respond to and recover from disruptions.",
  frameworkType: "iso22301",
  requirements: [
    // ── Clause 4 — Context of the Organization ───────────────────────────
    {
      identifier: "4.1",
      title: "Understanding the organization and its context",
      category: "Context of the Organization",
      description:
        "The organization shall determine external and internal issues relevant to its purpose that affect its ability to achieve the intended outcomes of the business continuity management system, including dependencies, the operating environment and the level of disruption it is willing to accept.",
      evidenceGuidance:
        "Documented context analysis (PESTLE / SWOT) covering disruption sources; risk-appetite statement for continuity; mapping of products, services and dependencies; periodic review minutes.",
    },
    {
      identifier: "4.2",
      title: "Understanding the needs and expectations of interested parties",
      category: "Context of the Organization",
      description:
        "The organization shall determine the interested parties relevant to the BCMS — including customers, regulators, suppliers, employees and the community — and their requirements, including legal, regulatory and contractual continuity obligations.",
      evidenceGuidance:
        "Stakeholder register with continuity-relevant requirements; legal and regulatory continuity obligations register; contract clauses on availability/recovery; engagement records.",
    },
    {
      identifier: "4.3",
      title: "Determining the scope of the BCMS",
      category: "Context of the Organization",
      description:
        "The organization shall determine the boundaries and applicability of the BCMS, identifying products and services, locations and activities in scope, and shall make the scope available as documented information.",
      evidenceGuidance:
        "Approved BCMS scope statement listing in-scope products, services and locations; documented exclusions with rationale; published scope on intranet / SoA.",
    },
    {
      identifier: "4.4",
      title: "Business continuity management system",
      category: "Context of the Organization",
      description:
        "The organization shall establish, implement, maintain and continually improve a business continuity management system, including the processes needed and their interactions, in accordance with the requirements of ISO 22301.",
      evidenceGuidance:
        "BCMS manual / process map; documented procedures; control list mapped to ISO 22301 clauses; integration points with ISMS, IT DR and crisis management.",
    },

    // ── Clause 5 — Leadership ────────────────────────────────────────────
    {
      identifier: "5.1",
      title: "Leadership and commitment",
      category: "Leadership",
      description:
        "Top management shall demonstrate leadership and commitment with respect to the BCMS by ensuring the policy and objectives are established, integrating BCMS requirements into business processes, providing resources and promoting continual improvement.",
      evidenceGuidance:
        "Board / executive minutes endorsing the BCMS; signed BC policy; resource-allocation evidence; BCMS objectives reported to senior management.",
    },
    {
      identifier: "5.2",
      title: "Policy",
      category: "Leadership",
      description:
        "Top management shall establish a business continuity policy that is appropriate to the purpose of the organization, provides a framework for setting BC objectives, includes a commitment to satisfy applicable requirements, and to continual improvement of the BCMS.",
      evidenceGuidance:
        "Approved BC policy with version history; distribution and acknowledgment records; review schedule; alignment to risk-appetite statement.",
    },
    {
      identifier: "5.3",
      title: "Organizational roles, responsibilities and authorities",
      category: "Leadership",
      description:
        "Top management shall ensure that responsibilities and authorities for roles relevant to the BCMS are assigned and communicated, including reporting on BCMS performance to top management.",
      evidenceGuidance:
        "RACI matrix for BC governance, business continuity manager, recovery teams; documented role descriptions; appointment letters; reporting lines diagram.",
    },

    // ── Clause 6 — Planning ──────────────────────────────────────────────
    {
      identifier: "6.1",
      title: "Actions to address risks and opportunities",
      category: "Planning",
      description:
        "When planning for the BCMS, the organization shall determine risks and opportunities that need to be addressed to give assurance the BCMS can achieve its intended outcomes, prevent or reduce undesired effects and achieve continual improvement.",
      evidenceGuidance:
        "BCMS risk and opportunity register; risk treatment plans linked to BC objectives; integration with enterprise risk management; treatment-effectiveness reviews.",
    },
    {
      identifier: "6.2",
      title: "Business continuity objectives and plans to achieve them",
      category: "Planning",
      description:
        "The organization shall establish business continuity objectives at relevant functions and levels — consistent with the BC policy, measurable where practicable, monitored and updated — and shall plan how to achieve them, including resources, responsibilities and timelines.",
      evidenceGuidance:
        "BC objectives document (e.g. RTO/RPO targets per priority service); plans tying objectives to delivery milestones; periodic objective-tracking reports; updates following management review.",
    },
    {
      identifier: "6.3",
      title: "Planning of changes to the BCMS",
      category: "Planning",
      description:
        "When the organization determines the need for changes to the BCMS, the changes shall be carried out in a planned manner, considering the purpose of the change, potential consequences and the availability of resources.",
      evidenceGuidance:
        "Change-impact assessments for BCMS scope or strategy changes; approved change records; updates to documented information; communication of changes to BC team.",
    },

    // ── Clause 7 — Support ───────────────────────────────────────────────
    {
      identifier: "7.1",
      title: "Resources",
      category: "Support",
      description:
        "The organization shall determine and provide the resources needed for the establishment, implementation, maintenance and continual improvement of the BCMS, including people, infrastructure, environment and information.",
      evidenceGuidance:
        "Resource plan covering BC team, alternate sites, communication tools and recovery infrastructure; budget evidence; resilient infrastructure design records.",
    },
    {
      identifier: "7.2",
      title: "Competence",
      category: "Support",
      description:
        "The organization shall determine the competence of personnel performing work that affects BCMS performance, ensure they are competent on the basis of education, training or experience, and retain documented information as evidence of competence.",
      evidenceGuidance:
        "Competence matrix for BC roles; training and exercise records; certifications (e.g. ISO 22301 Lead Implementer, BCI); competence assessments and gap-closure plans.",
    },
    {
      identifier: "7.3",
      title: "Awareness",
      category: "Support",
      description:
        "Persons doing work under the organization's control shall be aware of the business continuity policy, their contribution to BCMS effectiveness and their role during a disruption, including procedures for invoking BC plans.",
      evidenceGuidance:
        "Awareness training materials; completion records; tailored briefings for recovery roles; awareness reinforcement via desk drops and exercise debriefs.",
    },
    {
      identifier: "7.4",
      title: "Communication",
      category: "Support",
      description:
        "The organization shall determine the internal and external communications relevant to the BCMS and during disruptions — including what, when, with whom, and how to communicate — and shall provide the means to do so.",
      evidenceGuidance:
        "Communication plan covering customers, regulators, employees, media and suppliers; pre-approved holding statements; mass-notification tooling; contact lists with redundancy.",
    },
    {
      identifier: "7.5",
      title: "Documented information",
      category: "Support",
      description:
        "The BCMS shall include documented information required by ISO 22301 and other documented information determined by the organization as necessary for the effectiveness of the BCMS, controlled to ensure availability and protection.",
      evidenceGuidance:
        "Document control register; version history; access controls and retention rules; offline / out-of-band copies of critical BC plans for use during disruption.",
    },

    // ── Clause 8 — Operation ─────────────────────────────────────────────
    {
      identifier: "8.1",
      title: "Operational planning and control",
      category: "Operation",
      description:
        "The organization shall plan, implement and control the processes needed to meet BCMS requirements, implement the actions determined in clause 6, and control planned changes and review the consequences of unintended changes.",
      evidenceGuidance:
        "Documented BC operating procedures; operational change register impacting BCMS; deviation log; review records following unplanned changes.",
    },
    {
      identifier: "8.2",
      title: "Business impact analysis and risk assessment",
      category: "Operation",
      description:
        "The organization shall implement and maintain a process for business impact analysis and risk assessment that identifies activities supporting prioritised products and services, assesses the impacts of disruption over time, and identifies threats to those activities and their resources.",
      evidenceGuidance:
        "BIA workbook with RTO / RPO / MTPD / minimum business continuity objective per service; dependency maps; threat / risk register linked to BIA outputs; refresh cadence (at least annually and after major change).",
    },
    {
      identifier: "8.3",
      title: "Business continuity strategies and solutions",
      category: "Operation",
      description:
        "Based on the outputs of the BIA and risk assessment, the organization shall determine and select business continuity strategies and solutions to protect prioritised activities, stabilise, continue, resume and recover them within agreed timeframes.",
      evidenceGuidance:
        "Documented BC strategies (alternate sites, supplier diversification, manual workarounds, IT DR architecture); solution selection rationale; resource requirements (people, technology, premises, suppliers).",
    },
    {
      identifier: "8.4",
      title: "Business continuity plans and procedures",
      category: "Operation",
      description:
        "The organization shall establish and maintain procedures, including incident response, warning and communication, business continuity and IT recovery, to ensure continuity of activities and management of disruptive incidents.",
      evidenceGuidance:
        "Approved BC plans per priority service; incident response plan; crisis management plan; IT DR runbooks; cross-references to communication and supplier procedures.",
    },
    {
      identifier: "8.5",
      title: "Exercise programme",
      category: "Operation",
      description:
        "The organization shall implement and maintain an exercise programme to validate the effectiveness of its BC strategies and solutions over time, considering the scope, objectives and timing of exercises against the documented procedures.",
      evidenceGuidance:
        "Multi-year exercise calendar covering tabletop, walkthrough, simulation and live tests; exercise reports with findings and corrective actions; coverage analysis showing all priority services exercised.",
    },
    {
      identifier: "8.6",
      title: "Evaluation of business continuity documentation and capabilities",
      category: "Operation",
      description:
        "The organization shall evaluate the suitability, adequacy and effectiveness of its business continuity documentation, procedures and capabilities at planned intervals or following significant changes, and shall ensure they are up to date.",
      evidenceGuidance:
        "Annual BC documentation review records; post-incident reviews feeding plan updates; capability assessment scorecards; remediation tickets tracked to closure.",
    },

    // ── Clause 9 — Performance Evaluation ────────────────────────────────
    {
      identifier: "9.1",
      title: "Monitoring, measurement, analysis and evaluation",
      category: "Performance Evaluation",
      description:
        "The organization shall determine what needs to be monitored and measured for the BCMS — including performance against BC objectives — and shall analyse and evaluate the results to assess BCMS effectiveness.",
      evidenceGuidance:
        "BCMS KPI / metrics dashboard (RTO compliance, exercise coverage, training completion); analysis reports; trigger thresholds for management review.",
    },
    {
      identifier: "9.2",
      title: "Internal audit",
      category: "Performance Evaluation",
      description:
        "The organization shall conduct internal audits at planned intervals to confirm that the BCMS conforms to the organization's own requirements and to ISO 22301, and is effectively implemented and maintained.",
      evidenceGuidance:
        "Approved internal audit programme covering BCMS; audit schedule and reports; nonconformity register; auditor independence and competence evidence.",
    },
    {
      identifier: "9.3",
      title: "Management review",
      category: "Performance Evaluation",
      description:
        "Top management shall review the BCMS at planned intervals to ensure its continuing suitability, adequacy and effectiveness, considering changes in context, BC risks, performance and improvement opportunities.",
      evidenceGuidance:
        "Management review minutes covering inputs (audit results, exercise outcomes, BIA changes, risks, stakeholder feedback) and outputs (decisions, resource changes); review cadence in policy.",
    },

    // ── Clause 10 — Improvement ──────────────────────────────────────────
    {
      identifier: "10.1",
      title: "Nonconformity and corrective action",
      category: "Improvement",
      description:
        "When a nonconformity occurs in the BCMS — including those identified during exercises and real disruptions — the organization shall react to it, evaluate the need for action to eliminate root causes, implement corrective actions, and review their effectiveness.",
      evidenceGuidance:
        "Nonconformity register with RCA records; corrective-action plans; effectiveness verification records; trend analysis of repeat nonconformities; lessons-learned reports from incidents.",
    },
    {
      identifier: "10.2",
      title: "Continual improvement",
      category: "Improvement",
      description:
        "The organization shall continually improve the suitability, adequacy and effectiveness of the BCMS based on BCMS performance data, audit findings, exercise results, management review outputs and lessons learned from disruptions.",
      evidenceGuidance:
        "Continual improvement plan; improvement backlog tied to BCMS metrics; closed corrective actions; trend analysis demonstrating year-on-year RTO/RPO performance gains.",
    },
  ],
};
