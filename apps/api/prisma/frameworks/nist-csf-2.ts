import type { FrameworkDef } from "./index.js";

/**
 * NIST Cybersecurity Framework v2.0
 * Source: NIST CSWP 29 (Feb 2024) — The NIST Cybersecurity Framework 2.0
 *   https://doi.org/10.6028/NIST.CSWP.29
 *
 * Structure:
 *   6 Functions × 22 Categories × 106 Subcategories
 *   - GOVERN (GV)   — establish, communicate, and monitor cybersecurity strategy/expectations
 *   - IDENTIFY (ID) — understand current cybersecurity risks
 *   - PROTECT (PR)  — safeguards to manage cybersecurity risks
 *   - DETECT (DE)   — find and analyze possible cybersecurity attacks
 *   - RESPOND (RS)  — actions taken regarding a detected cybersecurity incident
 *   - RECOVER (RC)  — restore assets and operations affected by a cybersecurity incident
 *
 * Identifier scheme: official subcategory ID (e.g. `PR.AA-01`).
 * Category field: `"<FN>.<CAT> — <Category Name>"` to keep the dashboard
 * grouping aligned with the published taxonomy.
 *
 * NIST CSF 2.0 also defines four Implementation Tiers (Tier 1–4) describing
 * the rigor of an organization's cybersecurity risk governance/management.
 * The tier the organization is targeting is captured per-instance via
 * `FrameworkInstance.targetMaturityLevel` ("tier1"…"tier4").
 *
 * Subcategory descriptions are NIST's published outcome statements,
 * lightly normalised for sentence form. Evidence guidance lists the
 * concrete artifacts that an assessor or board reviewer would expect.
 */
export const NIST_CSF_2_FRAMEWORK: FrameworkDef = {
  name: "NIST CSF 2.0",
  version: "2.0 (Feb 2024)",
  description:
    "NIST Cybersecurity Framework v2.0 — outcome-based cybersecurity guidance organised into six Functions (Govern, Identify, Protect, Detect, Respond, Recover) covering 22 Categories and 106 Subcategories.",
  frameworkType: "nist_csf_2",
  requirements: [
    // ╔══════════════════════════════════════════════════════════════════╗
    // ║ GOVERN (GV)                                                     ║
    // ╚══════════════════════════════════════════════════════════════════╝

    // ── GV.OC — Organizational Context ────────────────────────────────
    {
      identifier: "GV.OC-01",
      title: "Organizational mission understood",
      category: "GV.OC — Organizational Context",
      description:
        "The organizational mission is understood and informs cybersecurity risk management.",
      evidenceGuidance:
        "Documented mission statement; cybersecurity strategy referencing it; board/CISO charter linking risk appetite to mission.",
    },
    {
      identifier: "GV.OC-02",
      title: "Internal/external stakeholders understood",
      category: "GV.OC — Organizational Context",
      description:
        "Internal and external stakeholders are understood, and their needs and expectations regarding cybersecurity risk management are understood and considered.",
      evidenceGuidance:
        "Stakeholder register; engagement plans; documented expectations from regulators, customers, partners, employees.",
    },
    {
      identifier: "GV.OC-03",
      title: "Legal, regulatory, contractual obligations understood",
      category: "GV.OC — Organizational Context",
      description:
        "Legal, regulatory, and contractual requirements regarding cybersecurity — including privacy and civil liberties — are understood and managed.",
      evidenceGuidance:
        "Compliance obligations register; privacy impact assessments; contract clause inventory; regulatory mapping.",
    },
    {
      identifier: "GV.OC-04",
      title: "Critical objectives/capabilities/services understood",
      category: "GV.OC — Organizational Context",
      description:
        "Critical objectives, capabilities, and services that external stakeholders depend on or expect from the organization are understood and communicated.",
      evidenceGuidance:
        "Service catalogue; criticality classification; SLAs published to customers/partners.",
    },
    {
      identifier: "GV.OC-05",
      title: "Outcomes/capabilities/services org depends on understood",
      category: "GV.OC — Organizational Context",
      description:
        "Outcomes, capabilities, and services that the organization depends on are understood and communicated.",
      evidenceGuidance:
        "Dependency map (suppliers, infrastructure, third parties); criticality ratings; communication channels for outage notification.",
    },

    // ── GV.RM — Risk Management Strategy ─────────────────────────────
    {
      identifier: "GV.RM-01",
      title: "Risk management objectives established",
      category: "GV.RM — Risk Management Strategy",
      description:
        "Risk management objectives are established and agreed to by organizational stakeholders.",
      evidenceGuidance:
        "Approved risk management policy with quantitative/qualitative objectives; minutes of stakeholder approval.",
    },
    {
      identifier: "GV.RM-02",
      title: "Risk appetite/tolerance statements established",
      category: "GV.RM — Risk Management Strategy",
      description:
        "Risk appetite and risk tolerance statements are established, communicated, and maintained.",
      evidenceGuidance:
        "Board-approved risk appetite statement; tolerance thresholds per risk category; review cadence.",
    },
    {
      identifier: "GV.RM-03",
      title: "Cybersecurity risk in ERM",
      category: "GV.RM — Risk Management Strategy",
      description:
        "Cybersecurity risk management activities and outcomes are included in enterprise risk management processes.",
      evidenceGuidance:
        "ERM register including cyber risks; integrated reporting to audit committee; common scoring methodology.",
    },
    {
      identifier: "GV.RM-04",
      title: "Strategic direction for risk response options",
      category: "GV.RM — Risk Management Strategy",
      description:
        "Strategic direction that describes appropriate risk response options is established and communicated.",
      evidenceGuidance:
        "Risk response strategy document covering avoid/mitigate/transfer/accept; communication evidence.",
    },
    {
      identifier: "GV.RM-05",
      title: "Lines of communication established",
      category: "GV.RM — Risk Management Strategy",
      description:
        "Lines of communication across the organization are established for cybersecurity risks, including risks from suppliers and other third parties.",
      evidenceGuidance:
        "Escalation matrix; incident communication runbooks; supplier risk reporting paths.",
    },
    {
      identifier: "GV.RM-06",
      title: "Standardized methods for risk calculation/prioritization",
      category: "GV.RM — Risk Management Strategy",
      description:
        "A standardized method for calculating, documenting, categorizing, and prioritizing cybersecurity risks is established and communicated.",
      evidenceGuidance:
        "Risk scoring methodology (e.g. FAIR, ISO 27005); risk register template; training records.",
    },
    {
      identifier: "GV.RM-07",
      title: "Strategic opportunities characterized/communicated",
      category: "GV.RM — Risk Management Strategy",
      description:
        "Strategic opportunities (i.e. positive risks) are characterized and are included in organizational cybersecurity risk discussions.",
      evidenceGuidance:
        "Risk register including opportunities; strategy reviews documenting upside considerations.",
    },

    // ── GV.RR — Roles, Responsibilities, and Authorities ─────────────
    {
      identifier: "GV.RR-01",
      title: "Leadership accountable for risk",
      category: "GV.RR — Roles, Responsibilities, and Authorities",
      description:
        "Organizational leadership is responsible and accountable for cybersecurity risk and fosters a culture that is risk-aware, ethical, and continually improving.",
      evidenceGuidance:
        "Board charter assigning cyber accountability; CEO/CISO role descriptions; cultural surveys.",
    },
    {
      identifier: "GV.RR-02",
      title: "Roles/responsibilities/authorities established",
      category: "GV.RR — Roles, Responsibilities, and Authorities",
      description:
        "Roles, responsibilities, and authorities related to cybersecurity risk management are established, communicated, understood, and enforced.",
      evidenceGuidance:
        "RACI matrix; documented job descriptions; access reviews aligned to roles.",
    },
    {
      identifier: "GV.RR-03",
      title: "Adequate resources allocated",
      category: "GV.RR — Roles, Responsibilities, and Authorities",
      description:
        "Adequate resources are allocated commensurate with cybersecurity risk strategy, roles, responsibilities, and policies.",
      evidenceGuidance: "Annual cybersecurity budget; headcount plan; tooling investment records.",
    },
    {
      identifier: "GV.RR-04",
      title: "Cybersecurity in HR practices",
      category: "GV.RR — Roles, Responsibilities, and Authorities",
      description: "Cybersecurity is included in human resources practices.",
      evidenceGuidance:
        "HR policy excerpts (background checks, onboarding security training, offboarding, sanctions); evidence of execution.",
    },

    // ── GV.PO — Policy ────────────────────────────────────────────────
    {
      identifier: "GV.PO-01",
      title: "Cybersecurity policy established/communicated",
      category: "GV.PO — Policy",
      description:
        "Policy for managing cybersecurity risks is established based on organizational context, cybersecurity strategy, and priorities, and is communicated and enforced.",
      evidenceGuidance:
        "Approved cybersecurity policy; distribution + acknowledgment records; enforcement evidence (sanctions, audits).",
    },
    {
      identifier: "GV.PO-02",
      title: "Policy reviewed/updated",
      category: "GV.PO — Policy",
      description:
        "Policy for managing cybersecurity risks is reviewed, updated, communicated, and enforced to reflect changes in requirements, threats, technology, and organizational mission.",
      evidenceGuidance:
        "Policy review schedule; change log; latest review minutes; updated communications.",
    },

    // ── GV.OV — Oversight ─────────────────────────────────────────────
    {
      identifier: "GV.OV-01",
      title: "Strategy outcomes reviewed",
      category: "GV.OV — Oversight",
      description:
        "Cybersecurity risk management strategy outcomes are reviewed to inform and adjust strategy and direction.",
      evidenceGuidance:
        "Annual or quarterly strategy review minutes; KPIs/KRIs reported to leadership; documented adjustments.",
    },
    {
      identifier: "GV.OV-02",
      title: "Strategy reviewed/adjusted",
      category: "GV.OV — Oversight",
      description:
        "The cybersecurity risk management strategy is reviewed and adjusted to ensure coverage of organizational requirements and risks.",
      evidenceGuidance:
        "Strategy refresh records; risk landscape briefings; coverage gap analyses.",
    },
    {
      identifier: "GV.OV-03",
      title: "Risk management performance evaluated",
      category: "GV.OV — Oversight",
      description:
        "Organizational cybersecurity risk management performance is evaluated and reviewed for adjustments needed.",
      evidenceGuidance: "Performance metrics dashboard; internal audit reports; remediation plans.",
    },

    // ── GV.SC — Cybersecurity Supply Chain Risk Management ────────────
    {
      identifier: "GV.SC-01",
      title: "C-SCRM program established",
      category: "GV.SC — Cybersecurity Supply Chain Risk Management",
      description:
        "A cybersecurity supply chain risk management program, strategy, objectives, policies, and processes are established and agreed to by organizational stakeholders.",
      evidenceGuidance: "C-SCRM program charter; policy; processes; stakeholder approvals.",
    },
    {
      identifier: "GV.SC-02",
      title: "C-SCRM roles/responsibilities established",
      category: "GV.SC — Cybersecurity Supply Chain Risk Management",
      description:
        "Cybersecurity roles and responsibilities for suppliers, customers, and partners are established, communicated, and coordinated internally and externally.",
      evidenceGuidance:
        "Vendor contract responsibility matrix; partner agreements; coordination records.",
    },
    {
      identifier: "GV.SC-03",
      title: "C-SCRM integrated into risk programs",
      category: "GV.SC — Cybersecurity Supply Chain Risk Management",
      description:
        "Cybersecurity supply chain risk management is integrated into cybersecurity and enterprise risk management, risk assessment, and improvement processes.",
      evidenceGuidance: "ERM/risk register includes supply chain risks; integrated risk reporting.",
    },
    {
      identifier: "GV.SC-04",
      title: "Suppliers known and prioritized by criticality",
      category: "GV.SC — Cybersecurity Supply Chain Risk Management",
      description: "Suppliers are known and prioritized by criticality.",
      evidenceGuidance:
        "Supplier inventory with criticality tiers; data flow / dependency mapping.",
    },
    {
      identifier: "GV.SC-05",
      title: "Requirements for suppliers established",
      category: "GV.SC — Cybersecurity Supply Chain Risk Management",
      description:
        "Requirements to address cybersecurity risks in supply chains are established, prioritized, and integrated into contracts and other types of agreements with suppliers and other relevant third parties.",
      evidenceGuidance:
        "Standard cybersecurity contract clauses; vendor risk assessments tied to contracts; remediation tracking.",
    },
    {
      identifier: "GV.SC-06",
      title: "Pre-engagement due diligence",
      category: "GV.SC — Cybersecurity Supply Chain Risk Management",
      description:
        "Planning and due diligence are performed to reduce risks before entering into formal supplier or other third-party relationships.",
      evidenceGuidance:
        "Vendor due diligence questionnaires; SOC2/ISO certifications collected; risk acceptance records.",
    },
    {
      identifier: "GV.SC-07",
      title: "Ongoing supplier risk monitoring",
      category: "GV.SC — Cybersecurity Supply Chain Risk Management",
      description:
        "The risks posed by a supplier, their products and services, and other third parties are understood, recorded, prioritized, assessed, responded to, and monitored over the course of the relationship.",
      evidenceGuidance:
        "Periodic vendor reassessment cadence; continuous monitoring tooling; incident tracking per vendor.",
    },
    {
      identifier: "GV.SC-08",
      title: "Suppliers included in incident planning/response/recovery",
      category: "GV.SC — Cybersecurity Supply Chain Risk Management",
      description:
        "Relevant suppliers and other third parties are included in incident planning, response, and recovery activities.",
      evidenceGuidance:
        "Incident response plan listing supplier contacts; joint exercise records; coordinated communications.",
    },
    {
      identifier: "GV.SC-09",
      title: "C-SCRM in product/service lifecycle",
      category: "GV.SC — Cybersecurity Supply Chain Risk Management",
      description:
        "Supply chain security practices are integrated into cybersecurity and enterprise risk management programs, and their performance is monitored throughout the technology product and service life cycle.",
      evidenceGuidance: "SDLC procurement gates; SBOM tracking; lifecycle metrics.",
    },
    {
      identifier: "GV.SC-10",
      title: "C-SCRM plan for end of relationships",
      category: "GV.SC — Cybersecurity Supply Chain Risk Management",
      description:
        "Cybersecurity supply chain risk management plans include provisions for activities that occur after the conclusion of a partnership or service agreement.",
      evidenceGuidance:
        "Contract exit/termination clauses; data return/destruction records; access revocation procedures.",
    },

    // ╔══════════════════════════════════════════════════════════════════╗
    // ║ IDENTIFY (ID)                                                    ║
    // ╚══════════════════════════════════════════════════════════════════╝

    // ── ID.AM — Asset Management ──────────────────────────────────────
    {
      identifier: "ID.AM-01",
      title: "Hardware inventoried",
      category: "ID.AM — Asset Management",
      description: "Inventories of hardware managed by the organization are maintained.",
      evidenceGuidance:
        "CMDB / asset management tool report; coverage metric; periodic reconciliation evidence.",
    },
    {
      identifier: "ID.AM-02",
      title: "Software/services/systems inventoried",
      category: "ID.AM — Asset Management",
      description:
        "Inventories of software, services, and systems managed by the organization are maintained.",
      evidenceGuidance: "Software inventory; SaaS inventory; SBOM coverage.",
    },
    {
      identifier: "ID.AM-03",
      title: "Authorized network communication maps maintained",
      category: "ID.AM — Asset Management",
      description:
        "Representations of the organization's authorized network communication and internal and external network data flows are maintained.",
      evidenceGuidance: "Network diagrams; data flow diagrams; firewall ruleset matched to flows.",
    },
    {
      identifier: "ID.AM-04",
      title: "Inventories of services provided by suppliers maintained",
      category: "ID.AM — Asset Management",
      description: "Inventories of services provided by suppliers are maintained.",
      evidenceGuidance: "Vendor service register; criticality tagging; integration map.",
    },
    {
      identifier: "ID.AM-05",
      title: "Assets prioritized by criticality",
      category: "ID.AM — Asset Management",
      description:
        "Assets are prioritized based on classification, criticality, resources, and impact on the mission.",
      evidenceGuidance:
        "Asset classification policy; tier ratings on each asset; mission-impact mapping.",
    },
    {
      identifier: "ID.AM-07",
      title: "Inventories of data and corresponding metadata maintained",
      category: "ID.AM — Asset Management",
      description:
        "Inventories of data and corresponding metadata for designated data types are maintained.",
      evidenceGuidance: "Data catalog/lineage tooling; metadata governance; sensitivity labels.",
    },
    {
      identifier: "ID.AM-08",
      title: "Systems/HW/SW/data managed throughout lifecycle",
      category: "ID.AM — Asset Management",
      description:
        "Systems, hardware, software, services, and data are managed throughout their life cycles.",
      evidenceGuidance: "Lifecycle policies; decommissioning records; secure disposal evidence.",
    },

    // ── ID.RA — Risk Assessment ───────────────────────────────────────
    {
      identifier: "ID.RA-01",
      title: "Vulnerabilities identified and recorded",
      category: "ID.RA — Risk Assessment",
      description: "Vulnerabilities in assets are identified, validated, and recorded.",
      evidenceGuidance: "Vulnerability scanner output; pen test reports; vulnerability tracker.",
    },
    {
      identifier: "ID.RA-02",
      title: "Cyber threat intelligence received and analyzed",
      category: "ID.RA — Risk Assessment",
      description:
        "Cyber threat intelligence is received from information sharing forums and sources.",
      evidenceGuidance: "ISAC memberships; threat intel feeds; analysis reports.",
    },
    {
      identifier: "ID.RA-03",
      title: "Internal/external threats identified/recorded",
      category: "ID.RA — Risk Assessment",
      description: "Internal and external threats to the organization are identified and recorded.",
      evidenceGuidance: "Threat library; insider threat program records; environmental scans.",
    },
    {
      identifier: "ID.RA-04",
      title: "Potential impacts and likelihoods identified/recorded",
      category: "ID.RA — Risk Assessment",
      description:
        "Potential impacts and likelihoods of threats exploiting vulnerabilities are identified and recorded.",
      evidenceGuidance: "Risk register with impact × likelihood scoring; scenario analyses.",
    },
    {
      identifier: "ID.RA-05",
      title: "Threats/vulnerabilities/likelihoods/impacts used to assess risk",
      category: "ID.RA — Risk Assessment",
      description:
        "Threats, vulnerabilities, likelihoods, and impacts are used to understand inherent risk and inform risk response prioritization.",
      evidenceGuidance: "Risk treatment plan; prioritization rubric; remediation roadmap.",
    },
    {
      identifier: "ID.RA-06",
      title: "Risk responses chosen, prioritized, planned, tracked",
      category: "ID.RA — Risk Assessment",
      description: "Risk responses are chosen, prioritized, planned, tracked, and communicated.",
      evidenceGuidance: "Risk treatment register; ticketed remediation; status reports.",
    },
    {
      identifier: "ID.RA-07",
      title: "Changes/exceptions managed and assessed",
      category: "ID.RA — Risk Assessment",
      description:
        "Changes and exceptions are managed, assessed for risk impact, recorded, and tracked.",
      evidenceGuidance:
        "Change advisory board records; exception register with expiry dates; risk acceptance approvals.",
    },
    {
      identifier: "ID.RA-08",
      title: "Vulnerability disclosure processes established",
      category: "ID.RA — Risk Assessment",
      description:
        "Processes for receiving, analyzing, and responding to vulnerability disclosures are established.",
      evidenceGuidance:
        "Published VDP; PSIRT runbook; metrics on disclosure volume + response times.",
    },
    {
      identifier: "ID.RA-09",
      title: "Authenticity/integrity of HW/SW assessed prior to use",
      category: "ID.RA — Risk Assessment",
      description:
        "The authenticity and integrity of hardware and software are assessed prior to acquisition and use.",
      evidenceGuidance: "Tamper-evident shipping; signature verification logs; SBOM ingestion.",
    },
    {
      identifier: "ID.RA-10",
      title: "Critical suppliers assessed prior to acquisition",
      category: "ID.RA — Risk Assessment",
      description: "Critical suppliers are assessed prior to acquisition.",
      evidenceGuidance: "Supplier risk assessments; certification reviews; sourcing decisions.",
    },

    // ── ID.IM — Improvement ───────────────────────────────────────────
    {
      identifier: "ID.IM-01",
      title: "Improvements identified from evaluations",
      category: "ID.IM — Improvement",
      description: "Improvements are identified from evaluations.",
      evidenceGuidance: "Internal audit findings; assessment reports; lessons-learned registers.",
    },
    {
      identifier: "ID.IM-02",
      title: "Improvements identified from security tests/exercises",
      category: "ID.IM — Improvement",
      description:
        "Improvements are identified from security tests and exercises, including those done in coordination with suppliers and relevant third parties.",
      evidenceGuidance: "Tabletop exercise after-action reports; red team / pen test reports.",
    },
    {
      identifier: "ID.IM-03",
      title: "Improvements from execution of operational processes",
      category: "ID.IM — Improvement",
      description:
        "Improvements are identified from execution of operational processes, procedures, and activities.",
      evidenceGuidance: "Operational metrics; retrospective notes; CAPA records.",
    },
    {
      identifier: "ID.IM-04",
      title: "Cybersecurity plans established/communicated/maintained",
      category: "ID.IM — Improvement",
      description:
        "Incident response plans and other cybersecurity plans that affect operations are established, communicated, maintained, and improved.",
      evidenceGuidance: "IR plan; BCDR plan; communication and training evidence; review cadence.",
    },

    // ╔══════════════════════════════════════════════════════════════════╗
    // ║ PROTECT (PR)                                                     ║
    // ╚══════════════════════════════════════════════════════════════════╝

    // ── PR.AA — Identity Management, Authentication, and Access Control
    {
      identifier: "PR.AA-01",
      title: "Identities and credentials managed",
      category: "PR.AA — Identity Management, Authentication, and Access Control",
      description:
        "Identities and credentials for authorized users, services, and hardware are managed by the organization.",
      evidenceGuidance:
        "Identity lifecycle process; PAM/IAM tooling; credential rotation evidence.",
    },
    {
      identifier: "PR.AA-02",
      title: "Identities proofed and bound to credentials",
      category: "PR.AA — Identity Management, Authentication, and Access Control",
      description:
        "Identities are proofed and bound to credentials based on the context of interactions.",
      evidenceGuidance: "Identity proofing procedures; onboarding records; binding ceremonies.",
    },
    {
      identifier: "PR.AA-03",
      title: "Users/services/hardware authenticated",
      category: "PR.AA — Identity Management, Authentication, and Access Control",
      description: "Users, services, and hardware are authenticated.",
      evidenceGuidance:
        "Authentication policy; MFA enforcement; service auth (mTLS, SPIFFE) records.",
    },
    {
      identifier: "PR.AA-04",
      title: "Identity assertions protected/conveyed/verified",
      category: "PR.AA — Identity Management, Authentication, and Access Control",
      description: "Identity assertions are protected, conveyed, and verified.",
      evidenceGuidance: "SAML/OIDC configuration; signing key management; verification logs.",
    },
    {
      identifier: "PR.AA-05",
      title: "Access permissions/entitlements/authorizations managed",
      category: "PR.AA — Identity Management, Authentication, and Access Control",
      description:
        "Access permissions, entitlements, and authorizations are defined in a policy, managed, enforced, and reviewed, and incorporate the principles of least privilege and separation of duties.",
      evidenceGuidance: "Access policies; entitlement reviews; SoD matrix; review attestations.",
    },
    {
      identifier: "PR.AA-06",
      title: "Physical access to assets managed",
      category: "PR.AA — Identity Management, Authentication, and Access Control",
      description:
        "Physical access to assets is managed, monitored, and enforced commensurate with risk.",
      evidenceGuidance:
        "Badge access logs; visitor records; CCTV monitoring; physical security policy.",
    },

    // ── PR.AT — Awareness and Training ────────────────────────────────
    {
      identifier: "PR.AT-01",
      title: "All personnel awareness/training",
      category: "PR.AT — Awareness and Training",
      description:
        "Personnel are provided with awareness and training so that they possess the knowledge and skills to perform general tasks with cybersecurity risks in mind.",
      evidenceGuidance:
        "Annual security awareness completion records; phishing simulation results.",
    },
    {
      identifier: "PR.AT-02",
      title: "Specialized roles awareness/training",
      category: "PR.AT — Awareness and Training",
      description:
        "Individuals in specialized roles are provided with awareness and training so that they possess the knowledge and skills to perform relevant tasks with cybersecurity risks in mind.",
      evidenceGuidance:
        "Role-based training records (developers, sysadmins, executives); certification tracking.",
    },

    // ── PR.DS — Data Security ─────────────────────────────────────────
    {
      identifier: "PR.DS-01",
      title: "Confidentiality/integrity/availability of data-at-rest protected",
      category: "PR.DS — Data Security",
      description:
        "The confidentiality, integrity, and availability of data-at-rest are protected.",
      evidenceGuidance:
        "Encryption-at-rest policy; KMS configuration; backup integrity validation.",
    },
    {
      identifier: "PR.DS-02",
      title: "Confidentiality/integrity/availability of data-in-transit protected",
      category: "PR.DS — Data Security",
      description:
        "The confidentiality, integrity, and availability of data-in-transit are protected.",
      evidenceGuidance:
        "TLS configuration; cipher suite policy; certificate management; mTLS for internal traffic.",
    },
    {
      identifier: "PR.DS-10",
      title: "Confidentiality/integrity/availability of data-in-use protected",
      category: "PR.DS — Data Security",
      description: "The confidentiality, integrity, and availability of data-in-use are protected.",
      evidenceGuidance:
        "Confidential computing or memory encryption; DLP on endpoints; secure enclaves.",
    },
    {
      identifier: "PR.DS-11",
      title: "Backups created, protected, maintained, tested",
      category: "PR.DS — Data Security",
      description: "Backups of data are created, protected, maintained, and tested.",
      evidenceGuidance: "Backup policy aligned to RPO/RTO; immutability; restoration test results.",
    },

    // ── PR.PS — Platform Security ─────────────────────────────────────
    {
      identifier: "PR.PS-01",
      title: "Configuration management practices established",
      category: "PR.PS — Platform Security",
      description: "Configuration management practices are established and applied.",
      evidenceGuidance: "Configuration baselines (CIS, STIG); IaC repos; drift detection.",
    },
    {
      identifier: "PR.PS-02",
      title: "Software maintained/replaced commensurate with risk",
      category: "PR.PS — Platform Security",
      description: "Software is maintained, replaced, and removed commensurate with risk.",
      evidenceGuidance: "Patch management metrics; EOL/EOS plans; software inventory grooming.",
    },
    {
      identifier: "PR.PS-03",
      title: "Hardware maintained/replaced commensurate with risk",
      category: "PR.PS — Platform Security",
      description: "Hardware is maintained, replaced, and removed commensurate with risk.",
      evidenceGuidance: "Hardware refresh policy; firmware update logs; disposal records.",
    },
    {
      identifier: "PR.PS-04",
      title: "Log records generated and made available for monitoring",
      category: "PR.PS — Platform Security",
      description: "Log records are generated and made available for continuous monitoring.",
      evidenceGuidance: "Centralised logging architecture; log source coverage; SIEM ingestion.",
    },
    {
      identifier: "PR.PS-05",
      title: "Installation and execution of unauthorized software prevented",
      category: "PR.PS — Platform Security",
      description: "Installation and execution of unauthorized software are prevented.",
      evidenceGuidance: "Application allowlisting; admin restrictions; software request workflows.",
    },
    {
      identifier: "PR.PS-06",
      title: "Secure software development practices integrated",
      category: "PR.PS — Platform Security",
      description:
        "Secure software development practices are integrated and their performance is monitored throughout the software development life cycle.",
      evidenceGuidance:
        "Secure SDLC standard; SAST/DAST/SCA pipeline reports; threat-modeling artefacts.",
    },

    // ── PR.IR — Technology Infrastructure Resilience ──────────────────
    {
      identifier: "PR.IR-01",
      title: "Networks and environments protected from unauthorized logical access",
      category: "PR.IR — Technology Infrastructure Resilience",
      description:
        "Networks and environments are protected from unauthorized logical access and usage.",
      evidenceGuidance: "Network segmentation; firewall rules; ZTNA architecture.",
    },
    {
      identifier: "PR.IR-02",
      title: "Technology assets protected from environmental threats",
      category: "PR.IR — Technology Infrastructure Resilience",
      description: "The organization's technology assets are protected from environmental threats.",
      evidenceGuidance:
        "Data center site assessments; HVAC, fire, flood detection; cloud region resilience design.",
    },
    {
      identifier: "PR.IR-03",
      title: "Mechanisms achieve resilience requirements",
      category: "PR.IR — Technology Infrastructure Resilience",
      description:
        "Mechanisms are implemented to achieve resilience requirements in normal and adverse situations.",
      evidenceGuidance: "HA architecture; chaos test results; capacity headroom monitoring.",
    },
    {
      identifier: "PR.IR-04",
      title: "Adequate resource capacity to ensure availability maintained",
      category: "PR.IR — Technology Infrastructure Resilience",
      description: "Adequate resource capacity to ensure availability is maintained.",
      evidenceGuidance: "Capacity planning reports; autoscaling configuration; quota monitoring.",
    },

    // ╔══════════════════════════════════════════════════════════════════╗
    // ║ DETECT (DE)                                                      ║
    // ╚══════════════════════════════════════════════════════════════════╝

    // ── DE.CM — Continuous Monitoring ─────────────────────────────────
    {
      identifier: "DE.CM-01",
      title: "Networks/network services monitored for adverse events",
      category: "DE.CM — Continuous Monitoring",
      description:
        "Networks and network services are monitored to find potentially adverse events.",
      evidenceGuidance: "NIDS/NDR coverage; flow monitoring; alerting metrics.",
    },
    {
      identifier: "DE.CM-02",
      title: "Physical environment monitored for adverse events",
      category: "DE.CM — Continuous Monitoring",
      description: "The physical environment is monitored to find potentially adverse events.",
      evidenceGuidance: "CCTV coverage; intrusion alarms; physical SOC integration.",
    },
    {
      identifier: "DE.CM-03",
      title: "Personnel/technology activity monitored for adverse events",
      category: "DE.CM — Continuous Monitoring",
      description:
        "Personnel activity and technology usage are monitored to find potentially adverse events.",
      evidenceGuidance: "EDR coverage; UEBA tooling; insider threat monitoring.",
    },
    {
      identifier: "DE.CM-06",
      title: "External service provider activities monitored",
      category: "DE.CM — Continuous Monitoring",
      description:
        "External service provider activities and services are monitored to find potentially adverse events.",
      evidenceGuidance:
        "Third-party monitoring tools; SaaS audit log ingestion; SOC2 attestations reviewed.",
    },
    {
      identifier: "DE.CM-09",
      title: "Computing hardware/software activity monitored",
      category: "DE.CM — Continuous Monitoring",
      description:
        "Computing hardware and software, runtime environments, and their data are monitored to find potentially adverse events.",
      evidenceGuidance:
        "Workload runtime monitoring (CWPP); Kubernetes audit logs; cloud trail ingestion.",
    },

    // ── DE.AE — Adverse Event Analysis ────────────────────────────────
    {
      identifier: "DE.AE-02",
      title: "Potentially adverse events analyzed",
      category: "DE.AE — Adverse Event Analysis",
      description:
        "Potentially adverse events are analyzed to better understand associated activities.",
      evidenceGuidance: "SOC playbooks; investigation tickets; analyst notes.",
    },
    {
      identifier: "DE.AE-03",
      title: "Information correlated from multiple sources",
      category: "DE.AE — Adverse Event Analysis",
      description: "Information is correlated from multiple sources.",
      evidenceGuidance: "SIEM correlation rules; SOAR enrichment workflows.",
    },
    {
      identifier: "DE.AE-04",
      title: "Estimated impact/scope of adverse events understood",
      category: "DE.AE — Adverse Event Analysis",
      description: "The estimated impact and scope of adverse events are understood.",
      evidenceGuidance:
        "Severity classification; blast radius assessments documented in incident records.",
    },
    {
      identifier: "DE.AE-06",
      title: "Adverse event information provided to authorized staff/tools",
      category: "DE.AE — Adverse Event Analysis",
      description: "Information on adverse events is provided to authorized staff and tools.",
      evidenceGuidance: "Notification routing; ticketing handoff; case management dashboards.",
    },
    {
      identifier: "DE.AE-07",
      title: "Cyber threat intelligence/other contextual information integrated",
      category: "DE.AE — Adverse Event Analysis",
      description:
        "Cyber threat intelligence and other contextual information are integrated into the analysis.",
      evidenceGuidance: "TIP integration; enriched alerts; intel-driven hunting reports.",
    },
    {
      identifier: "DE.AE-08",
      title: "Incidents declared when adverse events meet defined criteria",
      category: "DE.AE — Adverse Event Analysis",
      description: "Incidents are declared when adverse events meet the defined incident criteria.",
      evidenceGuidance:
        "Incident declaration criteria; declaration logs in incident management system.",
    },

    // ╔══════════════════════════════════════════════════════════════════╗
    // ║ RESPOND (RS)                                                     ║
    // ╚══════════════════════════════════════════════════════════════════╝

    // ── RS.MA — Incident Management ───────────────────────────────────
    {
      identifier: "RS.MA-01",
      title: "Incident response plan executed",
      category: "RS.MA — Incident Management",
      description:
        "The incident response plan is executed in coordination with relevant third parties once an incident is declared.",
      evidenceGuidance: "IR plan execution records; supplier coordination logs.",
    },
    {
      identifier: "RS.MA-02",
      title: "Incident reports triaged and validated",
      category: "RS.MA — Incident Management",
      description: "Incident reports are triaged and validated.",
      evidenceGuidance: "Triage SLA metrics; validation checklists; case enrichment.",
    },
    {
      identifier: "RS.MA-03",
      title: "Incidents categorized and prioritized",
      category: "RS.MA — Incident Management",
      description: "Incidents are categorized and prioritized.",
      evidenceGuidance: "Severity matrix; priority queue dashboards.",
    },
    {
      identifier: "RS.MA-04",
      title: "Incidents escalated/elevated as needed",
      category: "RS.MA — Incident Management",
      description: "Incidents are escalated or elevated as needed.",
      evidenceGuidance: "Escalation runbooks; on-call paging records; executive briefings.",
    },
    {
      identifier: "RS.MA-05",
      title: "Incident response criteria for initiating recovery applied",
      category: "RS.MA — Incident Management",
      description: "The criteria for initiating incident recovery are applied.",
      evidenceGuidance: "Recovery decision authority; runbooks; transition records into RC.RP.",
    },

    // ── RS.AN — Incident Analysis ─────────────────────────────────────
    {
      identifier: "RS.AN-03",
      title: "Incident analyses performed",
      category: "RS.AN — Incident Analysis",
      description:
        "Analyses are performed to establish what has taken place during an incident and the root cause of the incident.",
      evidenceGuidance: "Forensic analysis reports; RCA templates completed for each incident.",
    },
    {
      identifier: "RS.AN-06",
      title: "Actions performed during analysis recorded",
      category: "RS.AN — Incident Analysis",
      description:
        "Actions performed during an investigation are recorded, and the records' integrity and provenance are preserved.",
      evidenceGuidance: "Chain of custody documentation; tamper-evident case logs.",
    },
    {
      identifier: "RS.AN-07",
      title: "Incident data and metadata collected",
      category: "RS.AN — Incident Analysis",
      description:
        "Incident data and metadata are collected, and their integrity and provenance are preserved.",
      evidenceGuidance: "Evidence collection procedures; storage integrity (hashes, WORM).",
    },
    {
      identifier: "RS.AN-08",
      title: "Incident magnitude estimated and validated",
      category: "RS.AN — Incident Analysis",
      description: "An incident's magnitude is estimated and validated.",
      evidenceGuidance: "Impact assessments; quantitative loss estimates; affected-asset lists.",
    },

    // ── RS.CO — Incident Response Reporting and Communication ─────────
    {
      identifier: "RS.CO-02",
      title: "Internal/external stakeholders notified of incidents",
      category: "RS.CO — Incident Response Reporting and Communication",
      description: "Internal and external stakeholders are notified of incidents.",
      evidenceGuidance:
        "Stakeholder notification matrix; comms templates; sent communications archive.",
    },
    {
      identifier: "RS.CO-03",
      title: "Information shared with designated stakeholders",
      category: "RS.CO — Incident Response Reporting and Communication",
      description: "Information is shared with designated internal and external stakeholders.",
      evidenceGuidance: "Sharing agreements (e.g. ISACs); release approvals; published advisories.",
    },

    // ── RS.MI — Incident Mitigation ───────────────────────────────────
    {
      identifier: "RS.MI-01",
      title: "Incidents contained",
      category: "RS.MI — Incident Mitigation",
      description: "Incidents are contained.",
      evidenceGuidance: "Containment playbooks; isolation actions taken (network, account, host).",
    },
    {
      identifier: "RS.MI-02",
      title: "Incidents eradicated",
      category: "RS.MI — Incident Mitigation",
      description: "Incidents are eradicated.",
      evidenceGuidance: "Eradication checklist; malware removal evidence; persistence checks.",
    },

    // ╔══════════════════════════════════════════════════════════════════╗
    // ║ RECOVER (RC)                                                     ║
    // ╚══════════════════════════════════════════════════════════════════╝

    // ── RC.RP — Incident Recovery Plan Execution ──────────────────────
    {
      identifier: "RC.RP-01",
      title: "Recovery portion of IR plan executed",
      category: "RC.RP — Incident Recovery Plan Execution",
      description:
        "The recovery portion of the incident response plan is executed once initiated from the incident response process.",
      evidenceGuidance: "Recovery plan invocation records; coordination calls.",
    },
    {
      identifier: "RC.RP-02",
      title: "Recovery actions selected/scoped/prioritized/performed",
      category: "RC.RP — Incident Recovery Plan Execution",
      description: "Recovery actions are selected, scoped, prioritized, and performed.",
      evidenceGuidance: "Recovery work-breakdown; ticket queues; status reports.",
    },
    {
      identifier: "RC.RP-03",
      title: "Backups/preserved data integrity verified before restoration",
      category: "RC.RP — Incident Recovery Plan Execution",
      description:
        "The integrity of backups and other restoration assets is verified before using them for restoration.",
      evidenceGuidance: "Hash verification; test restores in clean room; tamper checks.",
    },
    {
      identifier: "RC.RP-04",
      title: "Critical mission functions/risk mgmt considered for recovery",
      category: "RC.RP — Incident Recovery Plan Execution",
      description:
        "Critical mission functions and cybersecurity risk management are considered to establish post-incident operational norms.",
      evidenceGuidance: "Recovery prioritization tied to BIA; revised security posture decisions.",
    },
    {
      identifier: "RC.RP-05",
      title: "Integrity of restored assets verified, systems/services restored",
      category: "RC.RP — Incident Recovery Plan Execution",
      description:
        "The integrity of restored assets is verified, systems and services are restored, and normal operating status is confirmed.",
      evidenceGuidance: "Verification checklists; service health validation; sign-off records.",
    },
    {
      identifier: "RC.RP-06",
      title: "End of incident recovery declared and incident docs completed",
      category: "RC.RP — Incident Recovery Plan Execution",
      description:
        "The end of incident recovery is declared based on criteria, and incident-related documentation is completed.",
      evidenceGuidance: "Closure criteria; final incident report; metrics captured.",
    },

    // ── RC.CO — Incident Recovery Communication ───────────────────────
    {
      identifier: "RC.CO-03",
      title: "Recovery activities/progress communicated to stakeholders",
      category: "RC.CO — Incident Recovery Communication",
      description:
        "Recovery activities and progress in restoring operational capabilities are communicated to designated internal and external stakeholders.",
      evidenceGuidance: "Status update cadence; communication artefacts archive.",
    },
    {
      identifier: "RC.CO-04",
      title: "Public updates on recovery shared using approved methods",
      category: "RC.CO — Incident Recovery Communication",
      description:
        "Public updates on incident recovery are shared using approved methods and messaging.",
      evidenceGuidance: "Comms approvals (legal/PR); published advisories; social media records.",
    },
  ],
};
