import type { FrameworkDef } from "./index.js";

/**
 * SOC 2 — Trust Services Criteria (TSC)
 * Source: AICPA TSP Section 100, 2017 Trust Services Criteria for Security,
 *   Availability, Processing Integrity, Confidentiality, and Privacy
 *   (revised with March 2020 points-of-focus and 2022 staff guidance)
 *   https://www.aicpa-cima.com/resources/landing/system-and-organization-controls-soc-suite-of-services
 *
 * Scope:
 *   - Common Criteria (CC1–CC9) — required for any SOC 2 report; map 1:1
 *     to the COSO 2013 internal-control framework principles.
 *   - Additional categories — included only when the service organisation
 *     scopes them in:
 *       A1   — Availability
 *       PI1  — Processing Integrity
 *       C1   — Confidentiality
 *       P1–P8 — Privacy (the 18 GAPP-derived criteria)
 *
 * Identifier scheme: official TSC criterion ID (e.g. `CC6.1`, `A1.2`,
 * `P3.2`). Stable across the 2017 → 2022 staff updates; we re-seed text if
 * AICPA publishes a points-of-focus revision.
 *
 * Description style: paraphrases the published criterion outcome statement
 * in the same outcome-focused tone used in the ISO 27001 entries — close
 * enough to remain accurate to the AICPA wording without reproducing the
 * proprietary text verbatim. Evidence guidance lists the artifacts an
 * external auditor (Type II walkthrough or test-of-operating-effectiveness)
 * would request to substantiate the criterion.
 */
export const SOC2_FRAMEWORK: FrameworkDef = {
  name: "SOC 2 Type II",
  version: "2017 TSC (with 2022 staff guidance)",
  description:
    "AICPA Trust Services Criteria for Security, Availability, Processing Integrity, Confidentiality, and Privacy — used for SOC 2 examinations of service organisations.",
  frameworkType: "soc2",
  requirements: [
    // ╔══════════════════════════════════════════════════════════════════╗
    // ║ CC1 — Control Environment                                        ║
    // ╚══════════════════════════════════════════════════════════════════╝
    {
      identifier: "CC1.1",
      title: "COSO Principle 1: Demonstrates commitment to integrity and ethical values",
      category: "Control Environment",
      description:
        "The entity demonstrates a commitment to integrity and ethical values through tone-at-the-top, a code of conduct, and processes that hold personnel accountable to those standards.",
      evidenceGuidance:
        "Approved code of conduct; annual employee acknowledgments; whistleblower / ethics hotline reports; HR sanctions register; tone-at-the-top communications from leadership.",
    },
    {
      identifier: "CC1.2",
      title: "COSO Principle 2: Board exercises oversight responsibility",
      category: "Control Environment",
      description:
        "The board of directors demonstrates independence from management and exercises oversight of the development and performance of internal control, including the entity's information security and trust commitments.",
      evidenceGuidance:
        "Board / audit committee charter referencing security oversight; independent director attestations; minutes recording security and risk briefings; board-approved security and risk policies.",
    },
    {
      identifier: "CC1.3",
      title: "COSO Principle 3: Management establishes structures, reporting lines, and authority",
      category: "Control Environment",
      description:
        "Management establishes, with board oversight, structures, reporting lines, and appropriate authorities and responsibilities in pursuit of the entity's objectives.",
      evidenceGuidance:
        "Org chart with reporting lines; documented roles, responsibilities and delegations of authority; CISO/security leader job description; segregation-of-duties matrix.",
    },
    {
      identifier: "CC1.4",
      title: "COSO Principle 4: Demonstrates commitment to competence",
      category: "Control Environment",
      description:
        "The entity demonstrates a commitment to attract, develop, and retain competent individuals in alignment with its objectives, including those supporting the system in scope.",
      evidenceGuidance:
        "Hiring criteria / job descriptions; background-check completion records; training and certification trackers; performance review templates referencing competence.",
    },
    {
      identifier: "CC1.5",
      title: "COSO Principle 5: Enforces accountability",
      category: "Control Environment",
      description:
        "The entity holds individuals accountable for their internal control responsibilities in the pursuit of objectives, including the operation of trust-services controls.",
      evidenceGuidance:
        "Performance reviews tied to security objectives; documented disciplinary procedures; sanctions register; KPIs/KRIs assigned to control owners and reported to leadership.",
    },

    // ╔══════════════════════════════════════════════════════════════════╗
    // ║ CC2 — Communication and Information                              ║
    // ╚══════════════════════════════════════════════════════════════════╝
    {
      identifier: "CC2.1",
      title: "COSO Principle 13: Obtains or generates relevant, quality information",
      category: "Communication and Information",
      description:
        "The entity obtains or generates and uses relevant, quality information to support the functioning of internal control, including the trust services criteria.",
      evidenceGuidance:
        "Security metrics dashboards; logging architecture documentation; data-quality controls; reports relied on by control owners and management.",
    },
    {
      identifier: "CC2.2",
      title: "COSO Principle 14: Internally communicates information",
      category: "Communication and Information",
      description:
        "The entity internally communicates information, including objectives and responsibilities for internal control, necessary to support the functioning of internal control and the trust services criteria.",
      evidenceGuidance:
        "Published security policies; intranet/wiki of controls; onboarding security training records; periodic awareness campaigns; town hall and team meeting notes referencing security responsibilities.",
    },
    {
      identifier: "CC2.3",
      title: "COSO Principle 15: Communicates with external parties",
      category: "Communication and Information",
      description:
        "The entity communicates with external parties — including customers, vendors, regulators and shareholders — regarding matters affecting the functioning of internal control over the trust services criteria.",
      evidenceGuidance:
        "Customer-facing trust portal / system description; published incident communications; regulator notifications; vendor security clauses; status page and SLA breach communications.",
    },

    // ╔══════════════════════════════════════════════════════════════════╗
    // ║ CC3 — Risk Assessment                                            ║
    // ╚══════════════════════════════════════════════════════════════════╝
    {
      identifier: "CC3.1",
      title: "COSO Principle 6: Specifies suitable objectives",
      category: "Risk Assessment",
      description:
        "The entity specifies objectives with sufficient clarity to enable the identification and assessment of risks relating to those objectives, including the entity's service commitments and system requirements.",
      evidenceGuidance:
        "Documented service commitments; system description; control objectives mapped to TSC; product/operational SLAs; trust commitments in customer agreements.",
    },
    {
      identifier: "CC3.2",
      title: "COSO Principle 7: Identifies and analyzes risk",
      category: "Risk Assessment",
      description:
        "The entity identifies risks to the achievement of its objectives across the entity and analyzes risks as a basis for determining how the risks should be managed.",
      evidenceGuidance:
        "Risk register with inherent/residual scoring; threat modelling outputs; risk assessment methodology; periodic risk-review minutes.",
    },
    {
      identifier: "CC3.3",
      title: "COSO Principle 8: Assesses fraud risk",
      category: "Risk Assessment",
      description:
        "The entity considers the potential for fraud — including unauthorized access, misuse of assets, and management override of controls — in assessing risks to the achievement of objectives.",
      evidenceGuidance:
        "Fraud risk assessment; insider threat program records; segregation-of-duties analyses; whistleblower channel; transaction-monitoring rules and exceptions.",
    },
    {
      identifier: "CC3.4",
      title: "COSO Principle 9: Identifies and analyzes significant change",
      category: "Risk Assessment",
      description:
        "The entity identifies and assesses changes — in the operating environment, business model, leadership, or technology — that could significantly impact the system of internal control.",
      evidenceGuidance:
        "Change impact assessments; risk reviews triggered by org changes / re-architecture / acquisitions; updated risk register entries; CAB approvals citing risk impact.",
    },

    // ╔══════════════════════════════════════════════════════════════════╗
    // ║ CC4 — Monitoring Activities                                      ║
    // ╚══════════════════════════════════════════════════════════════════╝
    {
      identifier: "CC4.1",
      title: "COSO Principle 16: Selects, develops, and performs ongoing/separate evaluations",
      category: "Monitoring Activities",
      description:
        "The entity selects, develops, and performs ongoing and/or separate evaluations to ascertain whether the components of internal control are present and functioning, including for the trust services criteria.",
      evidenceGuidance:
        "Internal audit plan and reports; control self-assessment results; continuous control monitoring tooling; periodic walkthroughs of operating effectiveness.",
    },
    {
      identifier: "CC4.2",
      title: "COSO Principle 17: Evaluates and communicates deficiencies",
      category: "Monitoring Activities",
      description:
        "The entity evaluates and communicates internal control deficiencies in a timely manner to those parties responsible for taking corrective action, including senior management and the board.",
      evidenceGuidance:
        "Deficiency tracker / remediation log; severity classification; management responses; audit committee reporting of unresolved findings.",
    },

    // ╔══════════════════════════════════════════════════════════════════╗
    // ║ CC5 — Control Activities                                         ║
    // ╚══════════════════════════════════════════════════════════════════╝
    {
      identifier: "CC5.1",
      title: "COSO Principle 10: Selects and develops control activities",
      category: "Control Activities",
      description:
        "The entity selects and develops control activities that contribute to the mitigation of risks to the achievement of objectives to acceptable levels.",
      evidenceGuidance:
        "Control matrix mapping risks to controls; control design documents; risk-control owner assignments; risk-treatment plans approved by management.",
    },
    {
      identifier: "CC5.2",
      title: "COSO Principle 11: Selects and develops general controls over technology",
      category: "Control Activities",
      description:
        "The entity selects and develops general control activities over technology to support the achievement of objectives, including infrastructure, security management, and software acquisition / development.",
      evidenceGuidance:
        "ITGC inventory (access, change, operations); SDLC standard; configuration baselines; cryptographic standards; backup and monitoring policies.",
    },
    {
      identifier: "CC5.3",
      title: "COSO Principle 12: Deploys through policies and procedures",
      category: "Control Activities",
      description:
        "The entity deploys control activities through policies that establish what is expected and through procedures that put policies into action.",
      evidenceGuidance:
        "Approved policies and SOPs; policy distribution and acknowledgment records; runbooks for operational controls; training references back to policy.",
    },

    // ╔══════════════════════════════════════════════════════════════════╗
    // ║ CC6 — Logical and Physical Access Controls                       ║
    // ╚══════════════════════════════════════════════════════════════════╝
    {
      identifier: "CC6.1",
      title: "Logical access security software, infrastructure, and architectures",
      category: "Logical and Physical Access",
      description:
        "The entity implements logical access security software, infrastructure and architectures over protected information assets to restrict access to authorised users and protect assets from threats originating outside the system boundary.",
      evidenceGuidance:
        "Identity provider (IdP) configuration; IAM role/group matrix; MFA enforcement evidence; firewall / WAF rulesets; network segmentation diagrams; periodic access reviews.",
    },
    {
      identifier: "CC6.2",
      title: "Prior to issuing system credentials, registered and authorized",
      category: "Logical and Physical Access",
      description:
        "Prior to issuing system credentials and granting system access, the entity registers and authorises new internal and external users whose access is administered by the entity, and removes access on termination.",
      evidenceGuidance:
        "Joiner / mover / leaver tickets with approvals; access request workflow; HR-IAM integration logs; sample onboarding and offboarding evidence; quarterly entitlement reconciliation.",
    },
    {
      identifier: "CC6.3",
      title: "Access to data, software, functions and other IT resources authorized and modified",
      category: "Logical and Physical Access",
      description:
        "The entity authorises, modifies, and removes access to data, software, functions, and other protected information assets based on roles, responsibilities, or the system design and changes, giving consideration to least privilege and segregation of duties.",
      evidenceGuidance:
        "RBAC / ABAC role definitions; least-privilege analyses; SoD matrix; just-in-time elevation logs; access-change tickets and approval evidence.",
    },
    {
      identifier: "CC6.4",
      title: "Physical access to facilities and protected information assets restricted",
      category: "Logical and Physical Access",
      description:
        "The entity restricts physical access to facilities and protected information assets — including data centres, server rooms, backup media, and other sensitive locations — to authorised personnel.",
      evidenceGuidance:
        "Badge access logs; visitor sign-in records; CCTV retention; data-centre tour reports; SOC 2 / ISO certification of upstream colo or cloud provider; physical access review records.",
    },
    {
      identifier: "CC6.5",
      title: "Logical access to protected information assets discontinued",
      category: "Logical and Physical Access",
      description:
        "The entity discontinues logical and physical protections over physical assets only after the ability to read or recover data or software has been diminished and is no longer required to meet the entity's objectives.",
      evidenceGuidance:
        "Secure media disposal procedures; certificates of destruction; cryptographic erasure logs; decommissioning checklists for endpoints, servers and storage.",
    },
    {
      identifier: "CC6.6",
      title: "External threats to information assets managed",
      category: "Logical and Physical Access",
      description:
        "The entity implements logical access security measures to protect against threats from sources outside its system boundaries, including malicious actors, malware and unauthorised network traffic.",
      evidenceGuidance:
        "Edge firewall and WAF rulesets; DDoS protection configuration; threat intelligence integration; vulnerability scan reports for external attack surface; external pen test report.",
    },
    {
      identifier: "CC6.7",
      title: "Transmission, movement, and removal of information restricted",
      category: "Logical and Physical Access",
      description:
        "The entity restricts the transmission, movement and removal of information to authorised internal and external users and processes, and protects it during transmission, movement, or removal to meet the entity's objectives.",
      evidenceGuidance:
        "TLS configuration and cipher policy; mTLS for internal traffic; DLP rules for email/endpoints; encrypted file transfer evidence; removable-media controls.",
    },
    {
      identifier: "CC6.8",
      title: "Controls to prevent or detect introduction of unauthorized or malicious software",
      category: "Logical and Physical Access",
      description:
        "The entity implements controls to prevent or detect and act upon the introduction of unauthorised or malicious software to meet the entity's objectives.",
      evidenceGuidance:
        "EDR/AV deployment coverage; application allowlisting policies; signed-image / admission-control policies for containers; SCA results in CI; quarantine action logs.",
    },

    // ╔══════════════════════════════════════════════════════════════════╗
    // ║ CC7 — System Operations                                          ║
    // ╚══════════════════════════════════════════════════════════════════╝
    {
      identifier: "CC7.1",
      title: "Detection and monitoring procedures detect anomalies indicative of threats",
      category: "System Operations",
      description:
        "To meet its objectives, the entity uses detection and monitoring procedures to identify (1) changes to configurations that result in the introduction of new vulnerabilities and (2) susceptibilities to newly discovered vulnerabilities.",
      evidenceGuidance:
        "Vulnerability scanner schedule and reports; configuration drift detection (e.g. CSPM); SIEM alert rules; threat-intelligence ingestion; sample triaged alerts.",
    },
    {
      identifier: "CC7.2",
      title: "Incidents are monitored and procedures exist to identify security incidents",
      category: "System Operations",
      description:
        "The entity monitors system components and the operation of those components for anomalies indicative of malicious acts, natural disasters, and errors affecting the entity's ability to meet its objectives, and analyses anomalies to determine whether they represent security events.",
      evidenceGuidance:
        "Centralised logging architecture; SIEM/SOC playbooks; on-call rotation; alert triage queues; sample case investigations.",
    },
    {
      identifier: "CC7.3",
      title: "Security incidents evaluated to determine impact",
      category: "System Operations",
      description:
        "The entity evaluates security events to determine whether they could or have resulted in a failure of the entity to meet its objectives — including impact on customer data and service commitments — and, if so, takes actions to prevent or address such failures.",
      evidenceGuidance:
        "Incident severity matrix; impact assessment templates; sample incident records with classification; post-incident review records.",
    },
    {
      identifier: "CC7.4",
      title: "Affected parties are notified of security incidents",
      category: "System Operations",
      description:
        "The entity responds to identified security incidents by executing a defined incident response program, including notifying customers, regulators and other affected parties as required by service commitments and legal/contractual obligations.",
      evidenceGuidance:
        "Incident response plan; customer/regulator notification templates; sent notifications archive; status-page and customer-comms records; legal/privacy review evidence.",
    },
    {
      identifier: "CC7.5",
      title: "Root cause of incident is identified and remediation actions taken",
      category: "System Operations",
      description:
        "The entity identifies, develops, and implements activities to recover from identified security incidents, including root-cause analysis and remediation actions to prevent recurrence.",
      evidenceGuidance:
        "Post-incident / RCA reports; remediation tickets tracked to closure; changes to controls / runbooks following incidents; lessons-learned register.",
    },

    // ╔══════════════════════════════════════════════════════════════════╗
    // ║ CC8 — Change Management                                          ║
    // ╚══════════════════════════════════════════════════════════════════╝
    {
      identifier: "CC8.1",
      title:
        "Changes to infrastructure, data, software and procedures authorized, designed, developed, configured, documented, tested, approved, and implemented",
      category: "Change Management",
      description:
        "The entity authorises, designs, develops or acquires, configures, documents, tests, approves, and implements changes to infrastructure, data, software, and procedures to meet its objectives.",
      evidenceGuidance:
        "Change management policy; pull-request approval / CAB records; CI/CD pipeline configuration with required checks (tests, SAST/DAST, peer review); deployment audit trails; emergency change records with retroactive approval.",
    },

    // ╔══════════════════════════════════════════════════════════════════╗
    // ║ CC9 — Risk Mitigation                                            ║
    // ╚══════════════════════════════════════════════════════════════════╝
    {
      identifier: "CC9.1",
      title: "Risk mitigation activities are identified and assessed",
      category: "Risk Mitigation",
      description:
        "The entity identifies, selects, and develops risk mitigation activities for risks arising from potential business disruptions, including the use of insurance, contractual transfer, and contingency planning.",
      evidenceGuidance:
        "Business continuity / disaster recovery plans; cyber-insurance policy; risk transfer schedule; tested fail-over and backup procedures.",
    },
    {
      identifier: "CC9.2",
      title: "Vendor and business partner risks managed",
      category: "Risk Mitigation",
      description:
        "The entity assesses and manages risks associated with vendors and business partners, including those that could affect the entity's ability to meet its objectives or honour its service commitments.",
      evidenceGuidance:
        "Vendor inventory with criticality tiers; due-diligence questionnaires; SOC 2 / ISO reports collected; contractual security clauses; ongoing monitoring evidence.",
    },

    // ╔══════════════════════════════════════════════════════════════════╗
    // ║ A1 — Availability                                                ║
    // ╚══════════════════════════════════════════════════════════════════╝
    {
      identifier: "A1.1",
      title: "Current processing capacity and usage maintained and monitored",
      category: "Availability",
      description:
        "The entity maintains, monitors, and evaluates current processing capacity and usage of system components to manage capacity demand and to enable the implementation of additional capacity to help meet its availability objectives.",
      evidenceGuidance:
        "Capacity planning reports; autoscaling configuration; quota and utilisation dashboards; capacity headroom alerts; trending vs SLA growth assumptions.",
    },
    {
      identifier: "A1.2",
      title: "Environmental protections, software, data backup, and recovery infrastructure",
      category: "Availability",
      description:
        "The entity authorises, designs, develops, implements, operates, approves, maintains, and monitors environmental protections, software, data back-up processes, and recovery infrastructure to meet its availability objectives.",
      evidenceGuidance:
        "Environmental controls evidence (HVAC, fire suppression, redundant power) for owned facilities or cloud provider attestations; backup policy aligned to RPO/RTO; backup job reports; multi-AZ/multi-region architecture diagrams.",
    },
    {
      identifier: "A1.3",
      title: "Recovery plan tests conducted and results communicated",
      category: "Availability",
      description:
        "The entity tests recovery plan procedures supporting system recovery to meet its availability objectives, and communicates results to relevant stakeholders.",
      evidenceGuidance:
        "Annual DR test plan; recovery test reports with measured RTO/RPO; gap remediation tickets; tabletop exercise after-action reports; test result communications to leadership.",
    },

    // ╔══════════════════════════════════════════════════════════════════╗
    // ║ PI1 — Processing Integrity                                       ║
    // ╚══════════════════════════════════════════════════════════════════╝
    {
      identifier: "PI1.1",
      title: "Procedures to define processing specifications",
      category: "Processing Integrity",
      description:
        "The entity obtains or generates, uses, and communicates relevant, quality information regarding the objectives related to processing — including definitions of data processed and product/service specifications — to support the use of products and services.",
      evidenceGuidance:
        "Documented data dictionary / API specifications; product requirements docs; data-quality SLAs; published API contracts and customer-facing specifications.",
    },
    {
      identifier: "PI1.2",
      title: "System inputs are complete, accurate, and processed timely",
      category: "Processing Integrity",
      description:
        "The entity implements policies and procedures over system inputs — including controls over completeness and accuracy — to result in products, services, and reporting that meet the entity's objectives.",
      evidenceGuidance:
        "Input validation rules in code; schema enforcement; reconciliation reports; rejected-record dashboards; integration test coverage of input edge cases.",
    },
    {
      identifier: "PI1.3",
      title: "System processing complete, valid, accurate, timely, and authorized",
      category: "Processing Integrity",
      description:
        "The entity implements policies and procedures over system processing to result in products, services and reporting that are complete, valid, accurate, timely and authorised, in line with the entity's objectives.",
      evidenceGuidance:
        "Processing reconciliations; idempotency / duplicate-detection design; pipeline monitoring; authorisation checks in business logic; sample exception reports.",
    },
    {
      identifier: "PI1.4",
      title: "System outputs complete, accurate, distributed, and retained",
      category: "Processing Integrity",
      description:
        "The entity implements policies and procedures to make available or deliver output completely, accurately, and timely in accordance with specifications to meet the entity's objectives.",
      evidenceGuidance:
        "Output reconciliation reports; delivery / webhook retry logs; signed reports / hash manifests; retention configuration aligned to commitments.",
    },
    {
      identifier: "PI1.5",
      title: "Inputs and processing stored completely, accurately, and timely",
      category: "Processing Integrity",
      description:
        "The entity implements policies and procedures to store inputs, items in processing, and outputs completely, accurately, and timely in accordance with system specifications to meet the entity's objectives.",
      evidenceGuidance:
        "Database backup integrity reports; checksum / hash verification; durable queue configurations; retention and archival policy with retention test evidence.",
    },

    // ╔══════════════════════════════════════════════════════════════════╗
    // ║ C1 — Confidentiality                                             ║
    // ╚══════════════════════════════════════════════════════════════════╝
    {
      identifier: "C1.1",
      title:
        "Confidential information identified and protected during collection, creation, and processing",
      category: "Confidentiality",
      description:
        "The entity identifies and maintains confidential information to meet the entity's objectives related to confidentiality, including labelling, handling and protecting it throughout collection, processing and storage.",
      evidenceGuidance:
        "Data classification policy and tagging scheme; DLP rules; encryption-at-rest and in-transit configuration; sample classified records with handling controls applied.",
    },
    {
      identifier: "C1.2",
      title: "Confidential information disposed to meet entity's objectives",
      category: "Confidentiality",
      description:
        "The entity disposes of confidential information to meet the entity's objectives related to confidentiality, in accordance with retention requirements, contractual commitments and legal obligations.",
      evidenceGuidance:
        "Retention schedule per data category; cryptographic erasure / certificate-of-destruction records; automated purge job logs; customer-driven deletion ticket history.",
    },

    // ╔══════════════════════════════════════════════════════════════════╗
    // ║ P1–P8 — Privacy                                                  ║
    // ╚══════════════════════════════════════════════════════════════════╝
    {
      identifier: "P1.1",
      title: "Privacy notice provided at or before collection",
      category: "Privacy",
      description:
        "The entity provides notice to data subjects about its privacy practices to meet the entity's objectives related to privacy, including the purposes for which personal information is collected, used, retained and disclosed.",
      evidenceGuidance:
        "Published privacy notice with version history; just-in-time privacy notices in product flows; privacy notice review schedule; sample notices captured at collection points.",
    },
    {
      identifier: "P2.1",
      title:
        "Choice and consent for collection, use, retention, disclosure, and disposal communicated and obtained",
      category: "Privacy",
      description:
        "The entity communicates choices available to data subjects regarding the collection, use, retention, disclosure and disposal of personal information, and obtains implicit or explicit consent to meet the entity's objectives related to privacy.",
      evidenceGuidance:
        "Consent capture mechanisms (cookie banner, opt-in forms, granular consent UI); consent management platform records; preference centre; just-in-time consent prompts in product flows; documented lawful-basis decisions per processing activity.",
    },
    {
      identifier: "P3.1",
      title: "Personal information collected consistent with the entity's privacy objectives",
      category: "Privacy",
      description:
        "Personal information is collected consistent with the entity's objectives related to privacy, limited to what is necessary for the purposes identified in the privacy notice and for which consent has been obtained.",
      evidenceGuidance:
        "Data inventory mapping each field to a stated purpose; minimisation reviews per processing activity; field-level justification in product designs; collection-method documentation; PIA outputs at point of collection.",
    },
    {
      identifier: "P3.2",
      title: "Explicit consent obtained for sensitive personal information",
      category: "Privacy",
      description:
        "For sensitive personal information (e.g. health, biometric, financial, political or religious views), the entity communicates the need for explicit consent and obtains that consent from the data subject prior to collection, use, retention, disclosure or disposal.",
      evidenceGuidance:
        "Sensitive-data classification policy; explicit-consent UX flows for sensitive categories; retained consent receipts; legal review of sensitive-data processing; sample audit of records collected under explicit consent.",
    },
    {
      identifier: "P4.1",
      title: "Personal information used only for identified purposes",
      category: "Privacy",
      description:
        "The entity limits the use of personal information to the purposes identified in the privacy notice and for which the data subject provided consent.",
      evidenceGuidance:
        "Purpose-binding policy; purpose tags in data warehouse; access controls aligned to purpose; sample audit of secondary-use proposals rejected or approved with re-consent.",
    },
    {
      identifier: "P4.2",
      title: "Personal information retained only for stated purposes",
      category: "Privacy",
      description:
        "Personal information is retained only as long as it is required for the purposes stated in the privacy notice, and is removed once those purposes no longer apply.",
      evidenceGuidance:
        "Purpose-bound retention rules; automated deletion workflows triggered by purpose-end events (e.g. account closure); sample audit logs confirming purpose-driven deletion.",
    },
    {
      identifier: "P4.3",
      title: "Personal information securely disposed of in line with privacy objectives",
      category: "Privacy",
      description:
        "The entity securely disposes of personal information at the end of the defined retention period or upon a valid data-subject deletion request, using methods that prevent reconstruction, to meet the entity's objectives related to privacy.",
      evidenceGuidance:
        "Cryptographic erasure / certificate-of-destruction records; automated purge job logs; data-subject deletion workflow tickets; media sanitisation procedures (NIST SP 800-88); audit confirmation that records are removed from primary stores, backups and replicas.",
    },
    {
      identifier: "P5.1",
      title: "Personal information access, corrections, and related requests handled",
      category: "Privacy",
      description:
        "The entity grants identified and authenticated data subjects access to their personal information for review and, upon request, provides physical or electronic copies to meet the entity's objectives related to privacy.",
      evidenceGuidance:
        "DSAR / access-request workflow; identity-verification procedure; sample request packages delivered; SLA dashboard for access requests.",
    },
    {
      identifier: "P5.2",
      title: "Requests for access, correction, and complaints addressed timely",
      category: "Privacy",
      description:
        "The entity corrects, amends, or appends personal information based on information provided by data subjects and communicates such information to third parties as committed or required.",
      evidenceGuidance:
        "Rectification workflow; sample correction tickets; downstream notification logs to processors / partners; SLA reporting on corrections.",
    },
    {
      identifier: "P6.1",
      title: "Personal information disclosed only to third parties with consent or stated purposes",
      category: "Privacy",
      description:
        "The entity discloses personal information to third parties only for the purposes identified in the notice and with the implicit or explicit consent of the data subject, including via data processing agreements with sub-processors.",
      evidenceGuidance:
        "Sub-processor register; signed DPAs; consent records linked to disclosures; purpose-bound API access logs; data sharing agreements.",
    },
    {
      identifier: "P6.2",
      title: "Records of disclosures to third parties are complete, accurate, and timely",
      category: "Privacy",
      description:
        "The entity creates and retains complete, accurate and timely records of authorised disclosures of personal information to third parties.",
      evidenceGuidance:
        "Disclosure log / data sharing register; per-customer access reports; export audit logs; retention of disclosure records aligned to commitments.",
    },
    {
      identifier: "P6.3",
      title: "Unauthorized disclosures of personal information identified",
      category: "Privacy",
      description:
        "The entity creates and retains records of detected or reported unauthorised disclosures of personal information, including breach severity and impacted data subjects.",
      evidenceGuidance:
        "Privacy incident register; DLP alert tickets; breach impact assessments; regulator and data-subject notifications archive.",
    },
    {
      identifier: "P6.4",
      title: "Third parties are assessed for compliance with privacy commitments",
      category: "Privacy",
      description:
        "The entity obtains privacy commitments from vendors and other third parties who have access to personal information and assesses ongoing compliance with those commitments to meet the entity's objectives related to privacy.",
      evidenceGuidance:
        "Vendor privacy questionnaires; signed DPAs with audit clauses; periodic vendor reassessments; collection of vendor SOC 2 / ISO / privacy attestations.",
    },
    {
      identifier: "P6.5",
      title: "Vendor and third-party compliance with privacy commitments assessed periodically",
      category: "Privacy",
      description:
        "The entity assesses, at least annually, the compliance of vendors and other third parties with the entity's privacy commitments and requirements, and takes corrective action when issues are identified.",
      evidenceGuidance:
        "Annual vendor privacy assessment plan; reassessment evidence per vendor (questionnaires, SOC 2 / ISO / privacy attestations, audit reports); corrective-action / remediation tracker; vendor risk ratings refreshed on a defined cadence.",
    },
    {
      identifier: "P7.1",
      title: "Personal information accurate, up-to-date, complete, and relevant",
      category: "Privacy",
      description:
        "The entity collects and maintains accurate, up-to-date, complete, and relevant personal information, and corrects inaccuracies in a timely manner, to meet the entity's objectives related to privacy.",
      evidenceGuidance:
        "Data quality controls; periodic data accuracy reviews; sample correction tickets; data-quality dashboards; field-level validation rules.",
    },
    {
      identifier: "P8.1",
      title: "Complaints and disputes relating to privacy are addressed timely",
      category: "Privacy",
      description:
        "The entity implements a process for receiving, addressing, resolving and communicating the resolution of inquiries, complaints and disputes from data subjects regarding the entity's privacy practices.",
      evidenceGuidance:
        "Privacy complaints register; resolution SLA dashboard; published privacy contact channel; sample resolution communications; escalation path to DPO/regulator.",
    },
  ],
};
