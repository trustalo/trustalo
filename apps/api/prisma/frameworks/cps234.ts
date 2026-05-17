import type { FrameworkDef } from "./index.js";

/**
 * APRA CPS 234 — Information Security
 * Source: APRA Prudential Standard CPS 234 (Nov 2018, effective 1 July 2019)
 *   https://www.apra.gov.au/information-security
 *
 * Applies to APRA-regulated entities — ADIs (banks), general insurers, life
 * insurers, private health insurers, RSE licensees (super funds), and their
 * authorised non-operating holding companies. Out of scope for non-regulated
 * entities, but the standard is increasingly cited in vendor due-diligence
 * by APRA-regulated customers.
 *
 * The standard has 36 paragraphs. Paragraphs 1-12 are scope / preliminaries;
 * paragraphs 13-36 contain the operational obligations an auditor or APRA
 * thematic review will walk through. We model only those 24 obligations as
 * requirements at the granularity APRA's CPG 234 practice guide and CPS 234
 * tripartite reviews actually test.
 *
 * Identifier scheme: `CPS234-<paragraph>` (e.g. `CPS234-13`). This keeps the
 * mapping back to the published standard unambiguous and survives any future
 * APRA renumbering — if APRA renumbers, we re-seed with the new paragraph
 * numbers and migrate existing assignments by identifier match.
 *
 * CPS 234 is a binary compliance standard — APRA does not publish a
 * three-tier maturity model — so `maturityLevel` is intentionally left
 * unset on all requirements.
 *
 * Companion guidance:
 *   - APRA CPG 234 Information Security (Jun 2019) — non-binding practice
 *     guide; cited in evidenceGuidance below.
 *   - APRA Information Paper "Cyber Security Stocktake" findings (2020)
 *     and FY24 thematic review observations.
 */
export const CPS234_FRAMEWORK: FrameworkDef = {
  name: "APRA CPS 234",
  version: "Nov 2018 (effective 1 Jul 2019)",
  description:
    "APRA Prudential Standard CPS 234 Information Security — obligations on APRA-regulated entities (banks, insurers, super funds) to maintain information security capability commensurate with the size and extent of threats to their information assets, including those managed by related parties.",
  frameworkType: "cps234",
  requirements: [
    // ── Roles and responsibilities (paras 13-14) ──────────────────────────
    {
      identifier: "CPS234-13",
      title: "Board ultimately responsible for information security",
      category: "Roles and responsibilities",
      description:
        "The Board of an APRA-regulated entity is ultimately responsible for ensuring that the entity maintains its information security. The Board must ensure information security is treated as a fundamental component of the entity's overall risk management framework.",
      evidenceGuidance:
        "Board charter or risk committee terms of reference referencing information security oversight; minutes of Board / Risk Committee meetings recording information-security briefings (at least half-yearly); approval records for the information security policy framework and any material policy changes.",
    },
    {
      identifier: "CPS234-14",
      title: "Information security roles and responsibilities clearly defined",
      category: "Roles and responsibilities",
      description:
        "The entity must clearly define the information security related roles and responsibilities of the Board, senior management, governing bodies and individuals with responsibility for decision-making, approval, oversight, operations and other information security functions.",
      evidenceGuidance:
        "RACI / responsibility matrix covering Board, CEO, CRO, CISO, line-of-business owners, and IT operations; position descriptions for the CISO and equivalent senior security officer; delegations register; segregation-of-duties rules between security operations and internal audit.",
    },

    // ── Information security capability (paras 15-19) ─────────────────────
    {
      identifier: "CPS234-15",
      title: "Information security capability commensurate with threats",
      category: "Information security capability",
      description:
        "The entity must maintain an information security capability commensurate with the size and extent of threats to its information assets, and which enables the continued sound operation of the entity. The capability must consider the vulnerabilities and threats to information assets, including those managed by related parties or third parties.",
      evidenceGuidance:
        "Documented information security capability assessment (people, processes, technology) referencing threat-intelligence inputs; security organisation chart and headcount benchmark vs peer institutions; current-state vs target-state capability roadmap; budget approval records demonstrating Board endorsement of security investment.",
    },
    {
      identifier: "CPS234-16",
      title: "Capability maintained against changing threats and environment",
      category: "Information security capability",
      description:
        "The entity must actively maintain its information security capability with respect to changes in vulnerabilities and threats, including those resulting from changes to information assets or its business environment.",
      evidenceGuidance:
        "Threat-intelligence subscription and review cadence; periodic threat-and-vulnerability assessments tied to architecture changes; project intake gate ensuring security-impact review before go-live; KRI dashboards reviewed at least quarterly by the CISO and Risk Committee.",
    },
    {
      identifier: "CPS234-17",
      title: "Assess information security capability of related parties / third parties",
      category: "Information security capability",
      description:
        "Where information assets are managed by a related party or third party, the entity must assess the information security capability of that party, commensurate with the potential consequences of an information security incident affecting those information assets.",
      evidenceGuidance:
        "Third-party / related-party register classified by criticality and data sensitivity; due-diligence questionnaires (e.g. CAIQ, SIG-Lite); independent attestations relied on (SOC 2 Type II, ISO 27001, IRAP); contractual right-to-audit / right-to-information clauses; reassessment cadence (at least annual for material providers).",
    },
    {
      identifier: "CPS234-18",
      title: "Procurement and lifecycle controls preserve information security capability",
      category: "Information security capability",
      description:
        "The entity must ensure that information security capability is maintained through procurement, change management, and ongoing operations of information assets, including assets managed by related or third parties.",
      evidenceGuidance:
        "Vendor onboarding playbook embedding security and contractual requirements (CPS 230 alignment where relevant); change-advisory-board minutes covering security risks; offboarding checklist for terminating providers (data return / destruction certificates); evidence of contractual SLAs for security incidents involving the provider.",
    },
    {
      identifier: "CPS234-19",
      title: "Independent and objective assessment of information security capability",
      category: "Information security capability",
      description:
        "The entity must regularly assess the information security capability of related parties and third parties, and the implications of such assessment for its own information security capability, taking into account the criticality and sensitivity of the information assets involved.",
      evidenceGuidance:
        "Annual third-party reassessment schedule with completion evidence; independent assurance reports collected and reviewed (Bridge / Gap letters); residual-risk acceptance records signed by the accountable executive; remediation plans for material findings tracked to closure.",
    },

    // ── Information security policy framework (paras 20-22) ───────────────
    {
      identifier: "CPS234-20",
      title: "Information security policy framework approved and maintained",
      category: "Policy framework",
      description:
        "The entity must maintain an information security policy framework that is commensurate with its exposures to vulnerabilities and threats, supports its information security capability, and provides direction on the responsibilities of all parties who have an obligation to maintain information security.",
      evidenceGuidance:
        "Master information-security policy with Board / Risk Committee approval record; subordinate policies (access control, cryptography, incident response, classification, change management, third-party security, secure development, physical security); annual review and re-approval evidence; controlled-document register and version history.",
    },
    {
      identifier: "CPS234-21",
      title: "Policy framework provides direction on responsibilities",
      category: "Policy framework",
      description:
        "The information security policy framework must provide direction on the responsibilities of all parties — including staff, contractors, related parties and third parties — who have an obligation to maintain the entity's information security.",
      evidenceGuidance:
        "Acceptable-use policy signed at induction and annually thereafter; clauses in third-party contracts and DPAs incorporating the policy framework; communication evidence (training rollouts, intranet attestation campaigns); breach-of-policy disciplinary process documented.",
    },
    {
      identifier: "CPS234-22",
      title: "Stakeholder responsibilities documented",
      category: "Policy framework",
      description:
        "The entity must clearly document the information security responsibilities of stakeholders, including senior management, business owners, technology, risk management, internal audit and individual staff.",
      evidenceGuidance:
        "Documented role-specific obligations (asset owners, system custodians, data stewards, IR commanders); RACI mapped to the control catalogue; awareness training tailored by role; 360-style attestations from accountable executives.",
    },

    // ── Information asset identification & classification (paras 23-24) ───
    {
      identifier: "CPS234-23",
      title: "Identify and classify information assets by criticality and sensitivity",
      category: "Information asset identification and classification",
      description:
        "The entity must classify its information assets, including those managed by related parties and third parties, by criticality and sensitivity. This classification must reflect the degree to which an information security incident affecting that asset has the potential to affect, financially or non-financially, the entity or the interests of depositors, policyholders, beneficiaries or other customers.",
      evidenceGuidance:
        "Information-asset register / CMDB with criticality and sensitivity tags; data-classification scheme with documented classification levels and handling rules; sign-off by asset owners; coverage of cloud, SaaS and outsourced services; reconciliation between the asset register and the third-party register.",
    },
    {
      identifier: "CPS234-24",
      title: "Classification scheme drives control selection",
      category: "Information asset identification and classification",
      description:
        "The classification of information assets must inform the selection and implementation of controls, with controls commensurate with the criticality and sensitivity of the asset and the threat environment in which it operates.",
      evidenceGuidance:
        "Mapping table from classification level → required controls (encryption strength, access-review frequency, backup tier, monitoring level); examples of control uplift triggered by reclassification; review evidence demonstrating that newly identified high-criticality assets received the corresponding control uplift within an SLA.",
    },

    // ── Implementation of controls (paras 25-29) ──────────────────────────
    {
      identifier: "CPS234-25",
      title: "Implement controls to protect information assets",
      category: "Implementation of controls",
      description:
        "The entity must have information security controls to protect its information assets, including those managed by related parties and third parties, that are implemented in a timely manner and that are commensurate with the vulnerabilities and threats to the information assets.",
      evidenceGuidance:
        "Control catalogue covering preventive, detective and corrective controls (e.g. mapped to ISO 27001 Annex A or NIST CSF); control-implementation evidence (configuration baselines, IAM policies, EDR coverage, network segmentation); SLA for new-control deployment from threat detection.",
    },
    {
      identifier: "CPS234-26",
      title: "Controls commensurate with criticality, sensitivity, threats",
      category: "Implementation of controls",
      description:
        "The entity must implement information security controls commensurate with the criticality and sensitivity of the information asset, the stage at which the asset is in its life-cycle, and the potential consequences of an information security incident.",
      evidenceGuidance:
        "Risk-acceptance records where controls are below the standard for an asset class; design documents demonstrating defence-in-depth for crown-jewel systems; lifecycle-stage controls (build-time SCA/SAST, run-time WAF/EDR, decommissioning sanitisation).",
    },
    {
      identifier: "CPS234-27",
      title: "Address vulnerabilities and threats throughout the asset lifecycle",
      category: "Implementation of controls",
      description:
        "The entity must address information security vulnerabilities and threats in a timely manner across the lifecycle of information assets — including design, acquisition, implementation, management and decommissioning — including where assets are managed by related parties or third parties.",
      evidenceGuidance:
        "Vulnerability-management policy with patch SLAs by severity and asset class; integration of vulnerability scanning into CI/CD; pen-test programme for internet-facing services; secure-decommissioning evidence (cryptographic erasure, certificates of destruction); vendor patch-cadence obligations in contracts.",
    },
    {
      identifier: "CPS234-28",
      title: "Information security controls embedded in BAU operations",
      category: "Implementation of controls",
      description:
        "Information security controls must be embedded in the ongoing operations of the entity, including monitoring, change management, capacity management, problem management, asset and configuration management, and identity and access management.",
      evidenceGuidance:
        "Operational runbooks referencing security controls; integration of security gates in change-management workflow; access-review evidence on a regular cadence (joiner/mover/leaver, privileged re-attestation); SIEM coverage and on-call rotation; secrets-rotation cadence and exception register.",
    },
    {
      identifier: "CPS234-29",
      title: "Controls cover information assets managed by related/third parties",
      category: "Implementation of controls",
      description:
        "Where information assets are managed by a related party or third party, the entity must obtain assurance — through suitable means — that the security controls applied to those information assets are commensurate with the criticality and sensitivity of the asset.",
      evidenceGuidance:
        "Provider control reports (SOC 2 Type II, ISO 27001 Statement of Applicability, IRAP report) reviewed and gap-assessed; bridge letters covering periods between attestations; contractual right to require remediation; tenant-side controls (CASB, BYOK, customer-managed keys) supplementing provider controls.",
    },

    // ── Incident management (para 30) ─────────────────────────────────────
    {
      identifier: "CPS234-30",
      title: "Robust incident management mechanisms",
      category: "Incident management",
      description:
        "The entity must have robust mechanisms in place to detect, and respond to, information security incidents in a timely manner. Incident response plans must define mechanisms to manage information security incidents that the entity considers could plausibly occur.",
      evidenceGuidance:
        "Incident-response plan with defined severity levels, escalation paths, RACI and external comms plan; tabletop exercise schedule and after-action reports (at least annually for severity-1 scenarios); SOC playbooks aligned with MITRE ATT&CK; lessons-learned register and remediation tracking; integration with the Board reporting cadence.",
    },

    // ── Testing control effectiveness (para 31) ───────────────────────────
    {
      identifier: "CPS234-31",
      title: "Test the effectiveness of controls through a systematic programme",
      category: "Testing control effectiveness",
      description:
        "The entity must test the effectiveness of its information security controls through a systematic testing program. The nature and frequency of testing must be commensurate with the rate at which the vulnerabilities and threats change, the criticality and sensitivity of the information asset, the consequences of an incident, the risks associated with the testing itself, and the changes to the information assets.",
      evidenceGuidance:
        "Annual security-testing plan covering vulnerability scanning, penetration testing, red-team exercises, phishing simulations, control walkthroughs and tabletop exercises; results and remediation register; coverage analysis tying test cadence to asset criticality; evidence of independent testing for crown-jewel systems.",
    },

    // ── Internal audit (para 32) ──────────────────────────────────────────
    {
      identifier: "CPS234-32",
      title: "Internal audit reviews of information security controls",
      category: "Internal audit",
      description:
        "The entity's internal audit function must review the design and operating effectiveness of information security controls — including controls maintained by related parties and third parties — and the design of the information security control assurance provided by related parties and third parties when relied upon by the entity.",
      evidenceGuidance:
        "Internal-audit charter referencing CPS 234; multi-year IA plan with risk-based coverage; audit reports addressed to the Audit Committee with Board reporting; remediation tracking to closure; periodic reliance assessment of provider attestations (e.g. IA review of vendor SOC 2 reports relied upon).",
    },

    // ── APRA notification (paras 33-36) ───────────────────────────────────
    {
      identifier: "CPS234-33",
      title: "Notify APRA of material information security incidents (72 hours)",
      category: "APRA notification",
      description:
        "The entity must notify APRA as soon as possible and, in any case, no later than 72 hours after becoming aware of an information security incident that materially affected, or had the potential to materially affect, financially or non-financially, the entity or the interests of depositors, policyholders, beneficiaries or other customers; or has been notified to other regulators, either in Australia or other jurisdictions.",
      evidenceGuidance:
        'Documented APRA-notification procedure with the 72-hour clock starting at "becoming aware"; severity-classification criteria triggering APRA notification; sample of past notifications (or signed nil-return); template letter to APRA; pre-defined notification owners and back-ups; the procedure tested via tabletop and recorded in the after-action report.',
    },
    {
      identifier: "CPS234-34",
      title: "Notification content covers nature, impact, response and remediation",
      category: "APRA notification",
      description:
        "Notifications to APRA in respect of material information security incidents must include a description of the incident, the impact, the response taken, and any remediation undertaken or planned.",
      evidenceGuidance:
        "Notification template covering incident summary, classification, affected information assets, customer impact, regulatory triggers, response timeline, root cause and planned remediation milestones; sign-off matrix (CISO, CRO, CEO); evidence of follow-up communication to APRA on remediation closure.",
    },
    {
      identifier: "CPS234-35",
      title: "Notify APRA of material information security control weaknesses (10 business days)",
      category: "APRA notification",
      description:
        "The entity must notify APRA as soon as possible and, in any case, no later than 10 business days after the entity becomes aware of a material information security control weakness which the entity expects it will not be able to remediate in a timely manner.",
      evidenceGuidance:
        'Definition of "material information security control weakness" (linked to risk-appetite thresholds); register of identified weaknesses with remediation ETAs and a flag triggering APRA notification when remediation cannot be completed in a timely manner; sample notifications or signed nil-returns; CRO and CISO sign-off records.',
    },
    {
      identifier: "CPS234-36",
      title: "Maintain records evidencing compliance",
      category: "APRA notification",
      description:
        "The entity must maintain records sufficient to demonstrate compliance with this Prudential Standard, including evidence of the information security capability, policy framework, control implementation, testing programme, incident management, internal audit and notifications.",
      evidenceGuidance:
        "Document-management system retaining policy versions, Board minutes, control evidence and incident records for at least 7 years (aligned with CPS 220 record-keeping); IA workpapers; APRA-notification register (incidents and control weaknesses); evidence of periodic CPS 234 self-assessments shared with APRA on request.",
    },
  ],
};
