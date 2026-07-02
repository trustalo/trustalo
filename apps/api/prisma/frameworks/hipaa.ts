import type { FrameworkDef } from "./index.js";

/**
 * HIPAA control catalog — distilled from the primary regulation text of
 * 45 CFR Part 164 (2013 Omnibus consolidation). The pack covers the
 * Security Rule at the granularity an OCR auditor or third-party assessor
 * actually walks through — the implementation specifications of
 * §164.308/.310/.312 plus the organizational (§164.314) and documentation
 * (§164.316) standards — together with the Breach Notification Rule
 * (§§164.400–414) and a small set of operational Privacy Rule obligations
 * (minimum necessary, BAAs, notice, individual rights).
 *
 * Curation notes (mirrors the GDPR pack's philosophy):
 *   • Where a Security Rule standard is fully expressed by its numbered
 *     implementation specifications, we list the specifications and skip
 *     the umbrella standard so requirements stay individually evidencable.
 *   • Rarely-applicable specifications (e.g. clearinghouse isolation
 *     §164.308(a)(4)(ii)(A), group-health-plan documents §164.314(b)) are
 *     deliberately omitted.
 *   • "Required" vs "Addressable" (§164.306(d)) is noted in descriptions
 *     where it changes how an entity may evidence the control. Addressable
 *     never means optional — it means "implement, or document why an
 *     alternative is reasonable and appropriate".
 *
 * All summaries are original paraphrases written from the CFR text.
 */
export const HIPAA_FRAMEWORK: FrameworkDef = {
  name: "HIPAA",
  version: "2013 Omnibus",
  description:
    "US Health Insurance Portability and Accountability Act — Security, Breach Notification and selected Privacy Rule requirements (45 CFR Part 164) for covered entities and business associates handling protected health information (PHI).",
  frameworkType: "hipaa",
  requirements: [
    // ── Administrative Safeguards — §164.308 ───────────────────────────
    {
      identifier: "164.308(a)(1)(ii)(A)",
      title: "Risk analysis",
      category: "Administrative Safeguards",
      description:
        "Conduct an accurate and thorough assessment of the potential risks and vulnerabilities to the confidentiality, integrity and availability of all electronic PHI the entity creates, receives, maintains or transmits. (Required)",
      evidenceGuidance:
        "Current enterprise risk analysis covering every system that touches ePHI; asset inventory scoping the analysis; re-assessment after material changes.",
    },
    {
      identifier: "164.308(a)(1)(ii)(B)",
      title: "Risk management",
      category: "Administrative Safeguards",
      description:
        "Implement security measures sufficient to reduce identified risks and vulnerabilities to a reasonable and appropriate level, consistent with the general requirements of §164.306(a). (Required)",
      evidenceGuidance:
        "Risk-treatment plan tied to the risk analysis; remediation tickets with owners and dates; residual-risk acceptance records.",
    },
    {
      identifier: "164.308(a)(1)(ii)(C)",
      title: "Sanction policy",
      category: "Administrative Safeguards",
      description:
        "Apply appropriate sanctions against workforce members who fail to comply with the entity's security policies and procedures. (Required)",
      evidenceGuidance:
        "Documented sanction policy; records of sanctions applied (redacted); HR acknowledgement at onboarding.",
    },
    {
      identifier: "164.308(a)(1)(ii)(D)",
      title: "Information system activity review",
      category: "Administrative Safeguards",
      description:
        "Regularly review records of information-system activity such as audit logs, access reports and security-incident tracking reports. (Required)",
      evidenceGuidance:
        "Log-review procedure and cadence; sampled review artefacts (SIEM reports, sign-offs); alerts raised from reviews.",
    },
    {
      identifier: "164.308(a)(2)",
      title: "Assigned security responsibility",
      category: "Administrative Safeguards",
      description:
        "Identify the security official who is responsible for developing and implementing the policies and procedures required by the Security Rule.",
      evidenceGuidance:
        "Appointment record naming the Security Official; role description; org chart showing reporting line.",
    },
    {
      identifier: "164.308(a)(3)(ii)(A)",
      title: "Authorization and/or supervision of workforce",
      category: "Administrative Safeguards",
      description:
        "Implement procedures for the authorization and/or supervision of workforce members who work with ePHI or in locations where it might be accessed. (Addressable)",
      evidenceGuidance:
        "Role-based access matrix; manager approval records for ePHI-handling roles; supervision arrangements for unauthorized-adjacent roles.",
    },
    {
      identifier: "164.308(a)(3)(ii)(B)",
      title: "Workforce clearance procedure",
      category: "Administrative Safeguards",
      description:
        "Implement procedures to determine that a workforce member's access to ePHI is appropriate before it is granted. (Addressable)",
      evidenceGuidance:
        "Background/reference screening records proportionate to role; documented clearance criteria per role.",
    },
    {
      identifier: "164.308(a)(3)(ii)(C)",
      title: "Termination procedures",
      category: "Administrative Safeguards",
      description:
        "Implement procedures for terminating access to ePHI when employment or another workforce arrangement ends, or when access is no longer appropriate under the clearance procedure. (Addressable)",
      evidenceGuidance:
        "Offboarding checklist with access-revocation timestamps; periodic reconciliation of leavers against active accounts.",
    },
    {
      identifier: "164.308(a)(4)(ii)(B)",
      title: "Access authorization",
      category: "Administrative Safeguards",
      description:
        "Implement policies and procedures for granting access to ePHI, for example through access to a workstation, transaction, program or process. (Addressable)",
      evidenceGuidance:
        "Access-request workflow with approver evidence; mapping of roles to ePHI systems and permitted transactions.",
    },
    {
      identifier: "164.308(a)(4)(ii)(C)",
      title: "Access establishment and modification",
      category: "Administrative Safeguards",
      description:
        "Implement policies and procedures that, based upon the access-authorization policies, establish, document, review and modify a user's right of access to a workstation, transaction, program or process. (Addressable)",
      evidenceGuidance:
        "Provisioning/change tickets; periodic user-access reviews with remediation of excess rights.",
    },
    {
      identifier: "164.308(a)(5)(ii)(A)",
      title: "Security reminders",
      category: "Administrative Safeguards",
      description:
        "Provide periodic security updates and reminders to all workforce members as part of the security awareness and training program. (Addressable)",
      evidenceGuidance:
        "Awareness campaign artefacts (newsletters, posters, phishing-simulation results) with distribution records.",
    },
    {
      identifier: "164.308(a)(5)(ii)(B)",
      title: "Protection from malicious software",
      category: "Administrative Safeguards",
      description:
        "Implement procedures for guarding against, detecting and reporting malicious software as part of workforce awareness and technical practice. (Addressable)",
      evidenceGuidance:
        "Anti-malware deployment coverage report; malware-incident reporting procedure; training module covering malware hygiene.",
    },
    {
      identifier: "164.308(a)(5)(ii)(C)",
      title: "Log-in monitoring",
      category: "Administrative Safeguards",
      description:
        "Implement procedures for monitoring log-in attempts and reporting discrepancies. (Addressable)",
      evidenceGuidance:
        "Failed-login alerting configuration; sample investigations of anomalous log-in reports.",
    },
    {
      identifier: "164.308(a)(5)(ii)(D)",
      title: "Password management",
      category: "Administrative Safeguards",
      description:
        "Implement procedures for creating, changing and safeguarding passwords. (Addressable)",
      evidenceGuidance:
        "Password/credential standard; IdP policy screenshots (complexity, rotation, vaulting); workforce guidance on credential handling.",
    },
    {
      identifier: "164.308(a)(6)(i)",
      title: "Security incident procedures",
      category: "Administrative Safeguards",
      description:
        "Implement policies and procedures to address security incidents affecting systems that handle ePHI.",
      evidenceGuidance:
        "Approved incident-response plan naming ePHI-specific triage steps; role assignments; escalation paths.",
    },
    {
      identifier: "164.308(a)(6)(ii)",
      title: "Incident response and reporting",
      category: "Administrative Safeguards",
      description:
        "Identify and respond to suspected or known security incidents; mitigate, to the extent practicable, their harmful effects; and document incidents and their outcomes. (Required)",
      evidenceGuidance:
        "Incident register with response timelines and outcomes; post-incident reviews; linkage into the breach risk-assessment process.",
    },
    {
      identifier: "164.308(a)(7)(ii)(A)",
      title: "Data backup plan",
      category: "Administrative Safeguards",
      description:
        "Establish and implement procedures to create and maintain retrievable exact copies of ePHI. (Required)",
      evidenceGuidance:
        "Backup configuration and schedules for every ePHI store; restore-test results; backup-integrity monitoring.",
    },
    {
      identifier: "164.308(a)(7)(ii)(B)",
      title: "Disaster recovery plan",
      category: "Administrative Safeguards",
      description:
        "Establish (and implement as needed) procedures to restore any loss of ePHI data. (Required)",
      evidenceGuidance:
        "DR plan covering ePHI systems with RTO/RPO targets; most recent DR exercise report.",
    },
    {
      identifier: "164.308(a)(7)(ii)(C)",
      title: "Emergency mode operation plan",
      category: "Administrative Safeguards",
      description:
        "Establish (and implement as needed) procedures to enable continuation of critical business processes that protect the security of ePHI while operating in emergency mode. (Required)",
      evidenceGuidance:
        "Emergency-mode runbooks; interim security controls defined for degraded operations.",
    },
    {
      identifier: "164.308(a)(7)(ii)(D)",
      title: "Contingency testing and revision",
      category: "Administrative Safeguards",
      description:
        "Implement procedures for periodic testing and revision of contingency plans. (Addressable)",
      evidenceGuidance:
        "Test calendar and results for backup/DR/emergency-mode plans; change log showing revisions after tests.",
    },
    {
      identifier: "164.308(a)(7)(ii)(E)",
      title: "Applications and data criticality analysis",
      category: "Administrative Safeguards",
      description:
        "Assess the relative criticality of specific applications and data in support of the other contingency-plan components. (Addressable)",
      evidenceGuidance:
        "Criticality/tiering register for applications holding ePHI, referenced by the DR plan's recovery ordering.",
    },
    {
      identifier: "164.308(a)(8)",
      title: "Periodic evaluation",
      category: "Administrative Safeguards",
      description:
        "Perform periodic technical and nontechnical evaluations — initially based on the Security Rule standards and thereafter in response to environmental or operational changes — establishing the extent to which policies and procedures meet the Rule's requirements.",
      evidenceGuidance:
        "Annual (or change-triggered) Security Rule evaluation report; independent assessment or internal audit artefacts.",
    },
    {
      identifier: "164.308(b)(1)",
      title: "Business associate contracts and other arrangements",
      category: "Administrative Safeguards",
      description:
        "A covered entity may permit a business associate to create, receive, maintain or transmit ePHI on its behalf only with satisfactory assurances, documented per §164.314(a), that the business associate will appropriately safeguard the information; business associates must obtain the same assurances from subcontractors.",
      evidenceGuidance:
        "Business associate inventory; executed BAAs for every vendor touching ePHI; subcontractor flow-down evidence.",
    },

    // ── Physical Safeguards — §164.310 ─────────────────────────────────
    {
      identifier: "164.310(a)(2)(i)",
      title: "Contingency operations (facility access)",
      category: "Physical Safeguards",
      description:
        "Establish (and implement as needed) procedures that allow facility access in support of data restoration under the disaster recovery and emergency mode operations plans. (Addressable)",
      evidenceGuidance:
        "Emergency facility-access procedure; authorized-personnel list for recovery operations.",
    },
    {
      identifier: "164.310(a)(2)(ii)",
      title: "Facility security plan",
      category: "Physical Safeguards",
      description:
        "Implement policies and procedures to safeguard the facility and its equipment from unauthorized physical access, tampering and theft. (Addressable)",
      evidenceGuidance:
        "Facility security plan; badge/lock/CCTV coverage; for cloud-hosted ePHI, provider physical-security attestations (SOC 2 / ISO).",
    },
    {
      identifier: "164.310(a)(2)(iii)",
      title: "Facility access control and validation",
      category: "Physical Safeguards",
      description:
        "Implement procedures to control and validate a person's access to facilities based on their role or function, including visitor control and control of access to software programs for testing and revision. (Addressable)",
      evidenceGuidance:
        "Badge-access rules per role; visitor log and escort policy; periodic physical-access reviews.",
    },
    {
      identifier: "164.310(a)(2)(iv)",
      title: "Maintenance records",
      category: "Physical Safeguards",
      description:
        "Implement policies and procedures to document repairs and modifications to the physical components of a facility related to security, such as hardware, walls, doors and locks. (Addressable)",
      evidenceGuidance: "Maintenance log for security-relevant facility components.",
    },
    {
      identifier: "164.310(b)",
      title: "Workstation use",
      category: "Physical Safeguards",
      description:
        "Implement policies and procedures specifying the proper functions to be performed, the manner of performance, and the physical attributes of the surroundings of workstations that can access ePHI.",
      evidenceGuidance:
        "Acceptable-use / workstation policy; guidance for clinical vs remote environments.",
    },
    {
      identifier: "164.310(c)",
      title: "Workstation security",
      category: "Physical Safeguards",
      description:
        "Implement physical safeguards for all workstations that access ePHI to restrict access to authorized users.",
      evidenceGuidance:
        "Screen-lock enforcement, privacy screens in shared areas, cable locks / secured rooms; device-posture reports.",
    },
    {
      identifier: "164.310(d)(2)(i)",
      title: "Media disposal",
      category: "Physical Safeguards",
      description:
        "Implement policies and procedures to address the final disposition of ePHI and of the hardware or electronic media on which it is stored. (Required)",
      evidenceGuidance:
        "Media-sanitization standard (e.g. NIST SP 800-88 aligned); destruction certificates from disposal vendors.",
    },
    {
      identifier: "164.310(d)(2)(ii)",
      title: "Media re-use",
      category: "Physical Safeguards",
      description:
        "Implement procedures for removal of ePHI from electronic media before the media are made available for re-use. (Required)",
      evidenceGuidance:
        "Wipe/re-image procedure with verification logs before device reallocation.",
    },
    {
      identifier: "164.310(d)(2)(iii)",
      title: "Media accountability",
      category: "Physical Safeguards",
      description:
        "Maintain a record of the movements of hardware and electronic media containing ePHI and any person responsible for them. (Addressable)",
      evidenceGuidance:
        "Asset register with custody tracking; chain-of-custody records for media leaving the facility.",
    },
    {
      identifier: "164.310(d)(2)(iv)",
      title: "Data backup before movement",
      category: "Physical Safeguards",
      description:
        "Create a retrievable, exact copy of ePHI, when needed, before movement of equipment. (Addressable)",
      evidenceGuidance: "Pre-move backup step in the equipment-relocation procedure with evidence.",
    },

    // ── Technical Safeguards — §164.312 ────────────────────────────────
    {
      identifier: "164.312(a)(2)(i)",
      title: "Unique user identification",
      category: "Technical Safeguards",
      description:
        "Assign a unique name and/or number for identifying and tracking user identity in systems containing ePHI. (Required)",
      evidenceGuidance:
        "IdP/user directory export showing no shared accounts on ePHI systems; service-account inventory with justification.",
    },
    {
      identifier: "164.312(a)(2)(ii)",
      title: "Emergency access procedure",
      category: "Technical Safeguards",
      description:
        "Establish (and implement as needed) procedures for obtaining necessary ePHI during an emergency. (Required)",
      evidenceGuidance:
        "Break-glass account procedure with post-use review; emergency-access audit trail.",
    },
    {
      identifier: "164.312(a)(2)(iii)",
      title: "Automatic logoff",
      category: "Technical Safeguards",
      description:
        "Implement electronic procedures that terminate an electronic session after a predetermined time of inactivity. (Addressable)",
      evidenceGuidance:
        "Session-timeout configuration on ePHI applications and managed endpoints (screen lock GPO/MDM policy).",
    },
    {
      identifier: "164.312(a)(2)(iv)",
      title: "Encryption and decryption (at rest)",
      category: "Technical Safeguards",
      description:
        "Implement a mechanism to encrypt and decrypt ePHI. (Addressable — but unencrypted ePHI lost or stolen is presumptively a reportable breach, so encryption is the de-facto safe harbor.)",
      evidenceGuidance:
        "Storage/database/disk encryption configuration for every ePHI store; key-management documentation.",
    },
    {
      identifier: "164.312(b)",
      title: "Audit controls",
      category: "Technical Safeguards",
      description:
        "Implement hardware, software and/or procedural mechanisms that record and examine activity in information systems that contain or use ePHI.",
      evidenceGuidance:
        "Audit-log configuration for ePHI systems (access, changes, exports); log retention settings; tamper-protection of logs.",
    },
    {
      identifier: "164.312(c)(1)",
      title: "Integrity of ePHI",
      category: "Technical Safeguards",
      description:
        "Implement policies and procedures to protect ePHI from improper alteration or destruction, including an electronic mechanism to corroborate that ePHI has not been altered or destroyed in an unauthorized manner (§164.312(c)(2), Addressable).",
      evidenceGuidance:
        "Integrity mechanisms (checksums, digital signatures, WORM storage, database constraints); change-audit trails on records.",
    },
    {
      identifier: "164.312(d)",
      title: "Person or entity authentication",
      category: "Technical Safeguards",
      description:
        "Implement procedures to verify that a person or entity seeking access to ePHI is the one claimed.",
      evidenceGuidance:
        "Authentication policy; MFA coverage for ePHI system access (especially remote); federation/SSO configuration.",
    },
    {
      identifier: "164.312(e)(2)(i)",
      title: "Transmission integrity controls",
      category: "Technical Safeguards",
      description:
        "Implement security measures to ensure that electronically transmitted ePHI is not improperly modified without detection until disposed of. (Addressable)",
      evidenceGuidance:
        "Integrity-protected transport (TLS, signed payloads) for interfaces exchanging ePHI; interface inventory.",
    },
    {
      identifier: "164.312(e)(2)(ii)",
      title: "Transmission encryption",
      category: "Technical Safeguards",
      description:
        "Implement a mechanism to encrypt ePHI whenever it is deemed appropriate — in practice, whenever ePHI transits open networks. (Addressable)",
      evidenceGuidance:
        "TLS configuration evidence (protocol/cipher scans) for ePHI endpoints; secure email/SFTP arrangements for external exchange.",
    },

    // ── Organizational Requirements — §164.314 ─────────────────────────
    {
      identifier: "164.314(a)(1)",
      title: "Business associate contract content (security)",
      category: "Organizational Requirements",
      description:
        "The written contract or other arrangement with a business associate must require compliance with the Security Rule, require subcontractors to comply through their own agreements, and require the business associate to report security incidents (including breaches of unsecured PHI) to the covered entity.",
      evidenceGuidance:
        "BAA template with Security Rule, subcontractor flow-down and incident-reporting clauses; legal review sign-off.",
    },

    // ── Policies and Documentation — §164.316 ──────────────────────────
    {
      identifier: "164.316(a)",
      title: "Security policies and procedures",
      category: "Policies & Documentation",
      description:
        "Implement reasonable and appropriate written policies and procedures to comply with the Security Rule, taking into account the entity's size, complexity, capabilities, infrastructure and risk; policies may be changed at any time provided changes are documented and implemented.",
      evidenceGuidance:
        "Published Security Rule policy set with owners and approval history mapped to each safeguard.",
    },
    {
      identifier: "164.316(b)(1)",
      title: "Documentation of actions and assessments",
      category: "Policies & Documentation",
      description:
        "Maintain the required policies and procedures in written (or electronic) form, and maintain a written record of any action, activity or assessment the Security Rule requires to be documented.",
      evidenceGuidance:
        "Central compliance repository containing risk analyses, reviews, incident records and training logs.",
    },
    {
      identifier: "164.316(b)(2)",
      title: "Documentation retention, availability and updates",
      category: "Policies & Documentation",
      description:
        "Retain required documentation for six years from creation or last effective date, make it available to those responsible for implementing the related procedures, and review and update it periodically in response to environmental or operational changes.",
      evidenceGuidance:
        "Retention configuration (≥6 years) on the compliance repository; access for implementers; periodic review log.",
    },

    // ── Breach Notification Rule — §§164.400–414 ───────────────────────
    {
      identifier: "164.402",
      title: "Breach definition and risk assessment",
      category: "Breach Notification",
      description:
        "Treat any impermissible acquisition, access, use or disclosure of unsecured PHI as a presumed breach unless a documented risk assessment — covering at least the nature of the PHI, the recipient, whether it was actually viewed, and mitigation — demonstrates a low probability of compromise.",
      evidenceGuidance:
        "Four-factor risk-assessment template; completed assessments for candidate incidents with conclusion and approver.",
    },
    {
      identifier: "164.404",
      title: "Notification to individuals",
      category: "Breach Notification",
      description:
        "Notify each individual whose unsecured PHI has been (or is reasonably believed to have been) breached, without unreasonable delay and no later than 60 calendar days after discovery, with the content prescribed by §164.404(c) and substitute notice where contact details are insufficient.",
      evidenceGuidance:
        "Breach register with discovery date and 60-day clock; notification letter template covering required content; proof of dispatch.",
    },
    {
      identifier: "164.406",
      title: "Notification to the media",
      category: "Breach Notification",
      description:
        "For a breach involving more than 500 residents of a State or jurisdiction, notify prominent media outlets serving that area without unreasonable delay and no later than 60 calendar days after discovery.",
      evidenceGuidance:
        "Media-notification step in the breach playbook; press-release records if triggered.",
    },
    {
      identifier: "164.408",
      title: "Notification to the Secretary (HHS)",
      category: "Breach Notification",
      description:
        "Notify the Secretary of HHS: contemporaneously with individual notice for breaches affecting 500 or more individuals, and within 60 days after the end of the calendar year (via the HHS portal log) for smaller breaches.",
      evidenceGuidance:
        "HHS submission receipts; annual small-breach log; calendar reminder for the year-end filing.",
    },
    {
      identifier: "164.410",
      title: "Notification by a business associate",
      category: "Breach Notification",
      description:
        "A business associate must notify the covered entity of a breach of unsecured PHI without unreasonable delay and no later than 60 calendar days after discovery, identifying affected individuals and providing available details.",
      evidenceGuidance:
        "BAA clause setting the reporting window (often contracted tighter than 60 days); BA breach-report intake records.",
    },
    {
      identifier: "164.414",
      title: "Administrative requirements and burden of proof",
      category: "Breach Notification",
      description:
        "Apply the §164.530 administrative requirements (training, sanctions, documentation) to breach notification, and be able to demonstrate either that all required notifications were made or that the incident did not constitute a breach.",
      evidenceGuidance:
        "Retained risk assessments and notification artefacts for every incident evaluated; breach-response training records.",
    },

    // ── Privacy Rule — selected operational requirements ───────────────
    {
      identifier: "164.502(b)",
      title: "Minimum necessary",
      category: "Privacy Rule",
      description:
        "When using or disclosing PHI, or requesting it from another covered entity, make reasonable efforts to limit the PHI to the minimum necessary to accomplish the intended purpose (subject to the §164.502(b)(2) exceptions such as treatment).",
      evidenceGuidance:
        "Minimum-necessary policy; role-based access profiles limiting PHI fields; periodic access-scope reviews.",
    },
    {
      identifier: "164.504(e)",
      title: "Business associate contract content (privacy)",
      category: "Privacy Rule",
      description:
        "Business associate contracts must establish the permitted and required uses and disclosures of PHI and bind the business associate to safeguards, individual-rights support, subcontractor flow-down, and return or destruction of PHI at termination where feasible.",
      evidenceGuidance:
        "BAA template covering §164.504(e) clauses; contract-management records showing coverage for all PHI vendors.",
    },
    {
      identifier: "164.520",
      title: "Notice of privacy practices",
      category: "Privacy Rule",
      description:
        "Maintain and provide a notice of privacy practices describing how PHI may be used and disclosed, the individual's rights, and the entity's legal duties; distribute and post it (including on the website) as prescribed.",
      evidenceGuidance:
        "Current NPP with revision history; distribution/acknowledgement records; website posting.",
    },
    {
      identifier: "164.524",
      title: "Individual right of access",
      category: "Privacy Rule",
      description:
        "Give individuals access to inspect and obtain a copy of their PHI in a designated record set, generally within 30 calendar days of the request (one 30-day extension permitted), in the form and format requested where readily producible, for no more than a cost-based fee.",
      evidenceGuidance:
        "Access-request workflow with SLA tracking; fulfilment records; fee schedule.",
    },
    {
      identifier: "164.526",
      title: "Right to amend PHI",
      category: "Privacy Rule",
      description:
        "Permit individuals to request amendment of PHI in a designated record set, act on the request within 60 days, and where a request is denied provide the prescribed written denial and record the individual's statement of disagreement.",
      evidenceGuidance: "Amendment-request log with dispositions and timelines.",
    },
    {
      identifier: "164.528",
      title: "Accounting of disclosures",
      category: "Privacy Rule",
      description:
        "Provide individuals, on request, an accounting of certain disclosures of their PHI made in the six years prior to the request, including date, recipient, description of the PHI and purpose.",
      evidenceGuidance:
        "Disclosure log capturing accountable disclosures; accounting-request fulfilment records.",
    },
    {
      identifier: "164.530",
      title: "Privacy administrative requirements",
      category: "Privacy Rule",
      description:
        "Designate a privacy official and complaint contact, train the workforce on privacy policies, apply sanctions for violations, maintain appropriate administrative/technical/physical safeguards for PHI in all forms, provide a complaint process, refrain from retaliation, and retain required documentation for six years.",
      evidenceGuidance:
        "Privacy-official appointment; privacy training completion records; complaint register; documentation-retention evidence.",
    },
  ],
};
