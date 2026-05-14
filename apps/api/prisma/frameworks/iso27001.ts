import type { FrameworkDef } from "./index.js";

export const ISO27001_FRAMEWORK: FrameworkDef = {
  name: "ISO/IEC 27001:2022",
  version: "2022",
  description:
    "Information security, cybersecurity and privacy protection — Information security management systems — Requirements",
  frameworkType: "iso27001",
  requirements: [
    // ── A.5 Organizational controls (37) ────────────────────────
    {
      identifier: "A.5.1",
      title: "Policies for information security",
      category: "Organizational Controls",
      description:
        "Information security policy and topic-specific policies shall be defined, approved by management, published, communicated to and acknowledged by relevant personnel and relevant interested parties, and reviewed at planned intervals and if significant changes occur.",
      evidenceGuidance:
        "Approved information security policy document; topic-specific policies (e.g. access control, acceptable use); distribution and acknowledgment records; scheduled review dates and minutes from policy reviews.",
    },
    {
      identifier: "A.5.2",
      title: "Information security roles and responsibilities",
      category: "Organizational Controls",
      description:
        "Information security roles and responsibilities shall be defined and allocated according to the organization needs.",
      evidenceGuidance:
        "RACI matrix or organizational chart showing security roles; job descriptions with security responsibilities; appointment letters for CISO/ISM roles; board or management approval records.",
    },
    {
      identifier: "A.5.3",
      title: "Segregation of duties",
      category: "Organizational Controls",
      description:
        "Conflicting duties and conflicting areas of responsibility shall be segregated.",
      evidenceGuidance:
        "Segregation of duties matrix; access control lists showing separated roles (e.g. developer vs deployer); workflow approvals requiring multiple parties; conflict-of-interest declarations.",
    },
    {
      identifier: "A.5.4",
      title: "Management responsibilities",
      category: "Organizational Controls",
      description:
        "Management shall require all personnel to apply information security in accordance with the established information security policy, topic-specific policies and procedures of the organization.",
      evidenceGuidance:
        "Management directives or memos on security compliance; signed employment agreements referencing security obligations; management meeting minutes discussing security; disciplinary procedure documentation.",
    },
    {
      identifier: "A.5.5",
      title: "Contact with authorities",
      category: "Organizational Controls",
      description:
        "The organization shall establish and maintain contact with relevant authorities.",
      evidenceGuidance:
        "Contact list of relevant authorities (data protection agencies, law enforcement, regulators); documented communication procedures; evidence of regulatory filings or notifications.",
    },
    {
      identifier: "A.5.6",
      title: "Contact with special interest groups",
      category: "Organizational Controls",
      description:
        "The organization shall establish and maintain contact with special interest groups or other specialist security forums and professional associations.",
      evidenceGuidance:
        "Membership records in security forums (e.g. ISACs, CERTs); attendance at industry conferences; subscription to threat intelligence feeds; participation in professional associations.",
    },
    {
      identifier: "A.5.7",
      title: "Threat intelligence",
      category: "Organizational Controls",
      description:
        "Information relating to information security threats shall be collected and analysed to produce threat intelligence.",
      evidenceGuidance:
        "Threat intelligence reports and feeds; vulnerability bulletins; threat assessment summaries; evidence of threat intelligence integration into risk management processes.",
    },
    {
      identifier: "A.5.8",
      title: "Information security in project management",
      category: "Organizational Controls",
      description: "Information security shall be integrated into project management.",
      evidenceGuidance:
        "Project management methodology or templates with security checkpoints; security risk assessments in project documentation; gate reviews including security criteria; project closure reports with security sign-off.",
    },
    {
      identifier: "A.5.9",
      title: "Inventory of information and other associated assets",
      category: "Organizational Controls",
      description:
        "An inventory of information and other associated assets, including owners, shall be developed and maintained.",
      evidenceGuidance:
        "Asset register or CMDB with asset owners assigned; classification labels applied; periodic asset inventory review records; automated discovery scan results.",
    },
    {
      identifier: "A.5.10",
      title: "Acceptable use of information and other associated assets",
      category: "Organizational Controls",
      description:
        "Rules for the acceptable use and procedures for handling information and other associated assets shall be identified, documented and implemented.",
      evidenceGuidance:
        "Acceptable use policy; signed user acknowledgment forms; handling procedures for classified information; examples of policy enforcement (e.g. DLP alerts, usage reports).",
    },
    {
      identifier: "A.5.11",
      title: "Return of assets",
      category: "Organizational Controls",
      description:
        "Personnel and other interested parties as appropriate shall return all the organization's assets in their possession upon change or termination of their employment, contract or agreement.",
      evidenceGuidance:
        "Offboarding checklist including asset return; signed asset return forms; IT equipment retrieval records; access revocation confirmation upon termination.",
    },
    {
      identifier: "A.5.12",
      title: "Classification of information",
      category: "Organizational Controls",
      description:
        "Information shall be classified according to the information security needs of the organization based on confidentiality, integrity, availability and relevant interested party requirements.",
      evidenceGuidance:
        "Information classification policy; classification scheme (e.g. Public, Internal, Confidential, Restricted); examples of classified documents; training materials on classification procedures.",
    },
    {
      identifier: "A.5.13",
      title: "Labelling of information",
      category: "Organizational Controls",
      description:
        "An appropriate set of procedures for information labelling shall be developed and implemented in accordance with the information classification scheme adopted by the organization.",
      evidenceGuidance:
        "Labelling procedures document; examples of labelled documents, emails, or files; automated labelling tool configurations; spot-check results verifying correct labelling.",
    },
    {
      identifier: "A.5.14",
      title: "Information transfer",
      category: "Organizational Controls",
      description:
        "Information transfer rules, procedures, or agreements shall be in place for all types of transfer facilities within the organization and between the organization and other parties.",
      evidenceGuidance:
        "Information transfer policy; data transfer agreements with third parties; encryption requirements for data in transit; secure file transfer logs; email security gateway configurations.",
    },
    {
      identifier: "A.5.15",
      title: "Access control",
      category: "Organizational Controls",
      description:
        "Rules to control physical and logical access to information and other associated assets shall be established and implemented based on business and information security requirements.",
      evidenceGuidance:
        "Access control policy; role-based access control (RBAC) matrix; access request and approval workflows; periodic access review reports; VPN and network access configurations.",
    },
    {
      identifier: "A.5.16",
      title: "Identity management",
      category: "Organizational Controls",
      description: "The full life cycle of identities shall be managed.",
      evidenceGuidance:
        "Identity lifecycle management procedures (provisioning, modification, deprovisioning); IAM system configurations; unique user ID evidence; joiner-mover-leaver process documentation.",
    },
    {
      identifier: "A.5.17",
      title: "Authentication information",
      category: "Organizational Controls",
      description:
        "Allocation and management of authentication information shall be controlled by a management process, including advising personnel on appropriate handling of authentication information.",
      evidenceGuidance:
        "Password policy (complexity, rotation, history); MFA enrollment records; authentication information management procedures; secure credential storage configurations (e.g. vault, SSO).",
    },
    {
      identifier: "A.5.18",
      title: "Access rights",
      category: "Organizational Controls",
      description:
        "Access rights to information and other associated assets shall be provisioned, reviewed, modified and removed in accordance with the organization's topic-specific policy on and rules for access control.",
      evidenceGuidance:
        "Access provisioning request tickets; periodic access review results and remediation actions; access modification records; deprovisioning confirmation upon role change or termination.",
    },
    {
      identifier: "A.5.19",
      title: "Information security in supplier relationships",
      category: "Organizational Controls",
      description:
        "Processes and procedures shall be defined and implemented to manage the information security risks associated with the use of supplier's products or services.",
      evidenceGuidance:
        "Supplier security assessment questionnaires; supplier risk register; third-party risk management policy; due diligence records; contractual security clauses.",
    },
    {
      identifier: "A.5.20",
      title: "Addressing information security within supplier agreements",
      category: "Organizational Controls",
      description:
        "Relevant information security requirements shall be established and agreed with each supplier based on the type of supplier relationship.",
      evidenceGuidance:
        "Supplier contracts with security clauses (data protection, incident notification, audit rights); NDAs; data processing agreements (DPAs); SLA definitions including security metrics.",
    },
    {
      identifier: "A.5.21",
      title: "Managing information security in the ICT supply chain",
      category: "Organizational Controls",
      description:
        "Processes and procedures shall be defined and implemented to manage the information security risks associated with the ICT products and services supply chain.",
      evidenceGuidance:
        "ICT supply chain risk assessment; software bill of materials (SBOM); vendor security certifications (SOC 2, ISO 27001); supply chain security policy; component verification procedures.",
    },
    {
      identifier: "A.5.22",
      title: "Monitoring, review and change management of supplier services",
      category: "Organizational Controls",
      description:
        "The organization shall regularly monitor, review, evaluate and manage change in supplier information security practices and service delivery.",
      evidenceGuidance:
        "Supplier performance review reports; periodic reassessment records; SLA monitoring dashboards; change notification procedures; incident reports from suppliers.",
    },
    {
      identifier: "A.5.23",
      title: "Information security for use of cloud services",
      category: "Organizational Controls",
      description:
        "Processes for acquisition, use, management and exit from cloud services shall be established in accordance with the organization's information security requirements.",
      evidenceGuidance:
        "Cloud security policy; cloud service provider assessment records; shared responsibility matrix; data residency documentation; cloud exit/migration plan.",
    },
    {
      identifier: "A.5.24",
      title: "Information security incident management planning and preparation",
      category: "Organizational Controls",
      description:
        "The organization shall plan and prepare for managing information security incidents by defining, establishing and communicating information security incident management processes, roles and responsibilities.",
      evidenceGuidance:
        "Incident response plan; incident classification and escalation matrix; CSIRT/CERT team charter and contact details; incident response playbooks; communication templates.",
    },
    {
      identifier: "A.5.25",
      title: "Assessment and decision on information security events",
      category: "Organizational Controls",
      description:
        "The organization shall assess information security events and decide if they are to be categorized as information security incidents.",
      evidenceGuidance:
        "Event triage procedures; incident classification criteria; SIEM alert rules and triage records; event assessment logs showing categorization decisions.",
    },
    {
      identifier: "A.5.26",
      title: "Response to information security incidents",
      category: "Organizational Controls",
      description:
        "Information security incidents shall be responded to in accordance with the documented procedures.",
      evidenceGuidance:
        "Completed incident response records; incident tickets with timeline of actions; containment and eradication evidence; post-incident communication records.",
    },
    {
      identifier: "A.5.27",
      title: "Learning from information security incidents",
      category: "Organizational Controls",
      description:
        "Knowledge gained from information security incidents shall be used to strengthen and improve the information security controls.",
      evidenceGuidance:
        "Post-incident review (lessons learned) reports; corrective action plans from incidents; evidence of control improvements made; updated playbooks or procedures based on lessons learned.",
    },
    {
      identifier: "A.5.28",
      title: "Collection of evidence",
      category: "Organizational Controls",
      description:
        "The organization shall establish and implement procedures for the identification, collection, acquisition and preservation of evidence related to information security events.",
      evidenceGuidance:
        "Evidence handling procedures; chain of custody forms; forensic tool inventory; log retention and integrity verification records; forensic investigation reports.",
    },
    {
      identifier: "A.5.29",
      title: "Information security during disruption",
      category: "Organizational Controls",
      description:
        "The organization shall plan how to maintain information security at an appropriate level during disruption.",
      evidenceGuidance:
        "Business continuity plan with security considerations; crisis management procedures; alternate processing site security arrangements; security controls for degraded operations.",
    },
    {
      identifier: "A.5.30",
      title: "ICT readiness for business continuity",
      category: "Organizational Controls",
      description:
        "ICT readiness shall be planned, implemented, maintained and tested based on business continuity objectives and ICT continuity requirements.",
      evidenceGuidance:
        "ICT continuity plan; disaster recovery runbooks; RTO/RPO definitions and test results; backup and restore test records; failover test evidence.",
    },
    {
      identifier: "A.5.31",
      title: "Legal, statutory, regulatory and contractual requirements",
      category: "Organizational Controls",
      description:
        "Legal, statutory, regulatory and contractual requirements relevant to information security and the organization's approach to meet these requirements shall be identified, documented and kept up to date.",
      evidenceGuidance:
        "Legal and regulatory requirements register; compliance obligations matrix; contractual security obligation tracker; legal counsel review records; regulatory change monitoring evidence.",
    },
    {
      identifier: "A.5.32",
      title: "Intellectual property rights",
      category: "Organizational Controls",
      description:
        "The organization shall implement appropriate procedures to protect intellectual property rights.",
      evidenceGuidance:
        "IP protection policy; software license register and compliance records; proprietary information handling procedures; patent or trademark registrations; open-source license compliance checks.",
    },
    {
      identifier: "A.5.33",
      title: "Protection of records",
      category: "Organizational Controls",
      description:
        "Records shall be protected from loss, destruction, falsification, unauthorized access and unauthorized release.",
      evidenceGuidance:
        "Records management policy; retention schedule; access controls on records repositories; backup and archival procedures for records; immutability or tamper-detection mechanisms.",
    },
    {
      identifier: "A.5.34",
      title: "Privacy and protection of personally identifiable information (PII)",
      category: "Organizational Controls",
      description:
        "The organization shall identify and meet the requirements regarding the preservation of privacy and protection of PII according to applicable laws and regulations and contractual requirements.",
      evidenceGuidance:
        "Privacy policy; data protection impact assessments (DPIAs); PII inventory and data flow diagrams; consent management records; data subject request handling logs; DPO appointment.",
    },
    {
      identifier: "A.5.35",
      title: "Independent review of information security",
      category: "Organizational Controls",
      description:
        "The organization's approach to managing information security and its implementation including people, processes and technologies shall be reviewed independently at planned intervals, or when significant changes occur.",
      evidenceGuidance:
        "Internal audit reports; external audit or certification reports; penetration test reports; independent review schedules; management response to findings and corrective action plans.",
    },
    {
      identifier: "A.5.36",
      title: "Compliance with policies, rules and standards for information security",
      category: "Organizational Controls",
      description:
        "Compliance with the organization's information security policy, topic-specific policies, rules and standards shall be regularly reviewed.",
      evidenceGuidance:
        "Compliance review reports; policy compliance dashboards; self-assessment results; exception and waiver register; remediation tracking for non-compliance findings.",
    },
    {
      identifier: "A.5.37",
      title: "Documented operating procedures",
      category: "Organizational Controls",
      description:
        "Operating procedures for information processing facilities shall be documented and made available to personnel who need them.",
      evidenceGuidance:
        "Standard operating procedures (SOPs) for IT operations; runbook repository; procedure version control history; evidence of staff access to procedures (e.g. wiki or document portal).",
    },

    // ── A.6 People controls (8) ────────────────────────────────
    {
      identifier: "A.6.1",
      title: "Screening",
      category: "People Controls",
      description:
        "Background verification checks on all candidates to become personnel shall be carried out prior to joining the organization and on an ongoing basis taking into consideration applicable laws, regulations and ethics and be proportional to the business requirements, the classification of the information to be accessed and the perceived risks.",
      evidenceGuidance:
        "Background check policy; screening records (criminal, employment, education verification); pre-employment check completion confirmations; ongoing re-screening schedule and records.",
    },
    {
      identifier: "A.6.2",
      title: "Terms and conditions of employment",
      category: "People Controls",
      description:
        "The employment contractual agreements shall state the personnel's and the organization's responsibilities for information security.",
      evidenceGuidance:
        "Employment contracts with security clauses; contractor agreements with security obligations; signed acceptable use agreements; confidentiality agreement templates.",
    },
    {
      identifier: "A.6.3",
      title: "Information security awareness, education and training",
      category: "People Controls",
      description:
        "Personnel of the organization and relevant interested parties shall receive appropriate information security awareness, education and training and regular updates of the organization's information security policy, topic-specific policies and procedures, as relevant for their job function.",
      evidenceGuidance:
        "Security awareness training program; training completion records and certificates; phishing simulation results; role-based training curriculum (e.g. secure coding for developers); training effectiveness assessments.",
    },
    {
      identifier: "A.6.4",
      title: "Disciplinary process",
      category: "People Controls",
      description:
        "A disciplinary process shall be formalized and communicated to take actions against personnel and other relevant interested parties who have committed an information security policy violation.",
      evidenceGuidance:
        "Disciplinary policy referencing security violations; communication records notifying staff of the process; anonymized examples of disciplinary actions taken; HR policy handbook excerpts.",
    },
    {
      identifier: "A.6.5",
      title: "Responsibilities after termination or change of employment",
      category: "People Controls",
      description:
        "Information security responsibilities and duties that remain valid after termination or change of employment shall be defined, enforced and communicated to relevant personnel and other interested parties.",
      evidenceGuidance:
        "Exit interview records covering security obligations; post-employment NDA enforcement; offboarding checklist with security items; reminder notifications of ongoing obligations.",
    },
    {
      identifier: "A.6.6",
      title: "Confidentiality or non-disclosure agreements",
      category: "People Controls",
      description:
        "Confidentiality or non-disclosure agreements reflecting the organization's needs for the protection of information shall be identified, documented, regularly reviewed and signed by personnel and other relevant interested parties.",
      evidenceGuidance:
        "NDA templates; signed NDA register; periodic NDA review records; NDA coverage for contractors and third parties; NDA renewal tracking.",
    },
    {
      identifier: "A.6.7",
      title: "Remote working",
      category: "People Controls",
      description:
        "Security measures shall be implemented when personnel are working remotely to protect information accessed, processed or stored outside the organization's premises.",
      evidenceGuidance:
        "Remote working policy; VPN usage records and configurations; endpoint security requirements for remote devices; secure home-office guidelines; remote access audit logs.",
    },
    {
      identifier: "A.6.8",
      title: "Information security event reporting",
      category: "People Controls",
      description:
        "The organization shall provide a mechanism for personnel to report observed or suspected information security events through appropriate channels in a timely manner.",
      evidenceGuidance:
        "Incident reporting procedure; reporting channels (helpdesk, email, web form); evidence of reported events and triage; awareness materials explaining how to report; response SLAs for reported events.",
    },

    // ── A.7 Physical controls (14) ─────────────────────────────
    {
      identifier: "A.7.1",
      title: "Physical security perimeters",
      category: "Physical Controls",
      description:
        "Security perimeters shall be defined and used to protect areas that contain information and other associated assets.",
      evidenceGuidance:
        "Site floor plans with security zones marked; perimeter security measures (fences, walls, barriers); access control point locations; security zone classification documentation.",
    },
    {
      identifier: "A.7.2",
      title: "Physical entry",
      category: "Physical Controls",
      description:
        "Secure areas shall be protected by appropriate entry controls and access points.",
      evidenceGuidance:
        "Badge/card access system records; visitor management logs; entry control procedures; access card issuance and revocation records; tailgating prevention measures.",
    },
    {
      identifier: "A.7.3",
      title: "Securing offices, rooms and facilities",
      category: "Physical Controls",
      description:
        "Physical security for offices, rooms and facilities shall be designed and implemented.",
      evidenceGuidance:
        "Facility security design documentation; server room access controls; locked cabinet or safe inventory; physical security assessment reports.",
    },
    {
      identifier: "A.7.4",
      title: "Physical security monitoring",
      category: "Physical Controls",
      description: "Premises shall be continuously monitored for unauthorized physical access.",
      evidenceGuidance:
        "CCTV system specifications and coverage maps; alarm system configurations and test records; security guard patrol schedules and logs; monitoring service contracts.",
    },
    {
      identifier: "A.7.5",
      title: "Protecting against physical and environmental threats",
      category: "Physical Controls",
      description:
        "Protection against physical and environmental threats, such as natural disasters and other intentional or unintentional physical threats to infrastructure shall be designed and implemented.",
      evidenceGuidance:
        "Environmental risk assessment; fire suppression system inspection records; flood protection measures; seismic reinforcement documentation; insurance policies covering physical threats.",
    },
    {
      identifier: "A.7.6",
      title: "Working in secure areas",
      category: "Physical Controls",
      description:
        "Security measures for working in secure areas shall be designed and implemented.",
      evidenceGuidance:
        "Secure area working procedures; photography/recording restrictions; supervision requirements for visitors in secure areas; clean area policies; sign-in/sign-out logs.",
    },
    {
      identifier: "A.7.7",
      title: "Clear desk and clear screen",
      category: "Physical Controls",
      description:
        "Clear desk rules for papers and removable storage media and clear screen rules for information processing facilities shall be defined and appropriately enforced.",
      evidenceGuidance:
        "Clear desk and clear screen policy; automatic screen lock configurations (e.g. GPO settings); spot-check audit results; secure storage (lockable drawers/cabinets) availability records.",
    },
    {
      identifier: "A.7.8",
      title: "Equipment siting and protection",
      category: "Physical Controls",
      description: "Equipment shall be sited securely and protected.",
      evidenceGuidance:
        "Data center or server room environmental controls (HVAC, humidity); equipment placement standards; physical protection of network equipment; rack security (locked cabinets).",
    },
    {
      identifier: "A.7.9",
      title: "Security of assets off-premises",
      category: "Physical Controls",
      description: "Off-site assets shall be protected.",
      evidenceGuidance:
        "Off-site asset tracking register; encryption requirements for portable devices; asset handling procedures for transport; secure courier or shipping records.",
    },
    {
      identifier: "A.7.10",
      title: "Storage media",
      category: "Physical Controls",
      description:
        "Storage media shall be managed through their life cycle of acquisition, use, transportation and disposal in accordance with the organization's classification scheme and handling requirements.",
      evidenceGuidance:
        "Media handling and disposal procedures; media inventory and tracking; secure disposal certificates (e.g. shredding, degaussing); encrypted media configurations.",
    },
    {
      identifier: "A.7.11",
      title: "Supporting utilities",
      category: "Physical Controls",
      description:
        "Information processing facilities shall be protected from power failures and other disruptions caused by failures in supporting utilities.",
      evidenceGuidance:
        "UPS system specifications and test records; generator maintenance logs; redundant power supply documentation; utility failure incident reports and response records.",
    },
    {
      identifier: "A.7.12",
      title: "Cabling security",
      category: "Physical Controls",
      description:
        "Cables carrying power, data or supporting information services shall be protected from interception, interference or damage.",
      evidenceGuidance:
        "Cable management standards; cable route documentation; physical cable protection measures (conduits, locked cabinets); network patching records; fibre optic vs copper usage rationale.",
    },
    {
      identifier: "A.7.13",
      title: "Equipment maintenance",
      category: "Physical Controls",
      description:
        "Equipment shall be maintained correctly to ensure availability, integrity and confidentiality of information.",
      evidenceGuidance:
        "Maintenance schedules and logs; authorized maintenance personnel register; data sanitization before equipment leaves for repair; warranty and support contract records.",
    },
    {
      identifier: "A.7.14",
      title: "Secure disposal or re-use of equipment",
      category: "Physical Controls",
      description:
        "Items of equipment containing storage media shall be verified to ensure that any sensitive data and licensed software has been removed or securely overwritten prior to disposal or re-use.",
      evidenceGuidance:
        "Data sanitization procedures (NIST 800-88 or equivalent); certificates of destruction; disposal vendor contracts; verified wipe logs; asset decommissioning records.",
    },

    // ── A.8 Technological controls (34) ────────────────────────
    {
      identifier: "A.8.1",
      title: "User end point devices",
      category: "Technological Controls",
      description:
        "Information stored on, processed by or accessible via user end point devices shall be protected.",
      evidenceGuidance:
        "Endpoint protection policy; MDM/EDR deployment records; device encryption status reports; endpoint security configuration baselines; BYOD policy and enrollment records.",
    },
    {
      identifier: "A.8.2",
      title: "Privileged access rights",
      category: "Technological Controls",
      description:
        "The allocation and use of privileged access rights shall be restricted and managed.",
      evidenceGuidance:
        "Privileged access management (PAM) tool configurations; admin account inventory; just-in-time access records; privileged access review reports; session recording or logging for admin activities.",
    },
    {
      identifier: "A.8.3",
      title: "Information access restriction",
      category: "Technological Controls",
      description:
        "Access to information and other associated assets shall be restricted in accordance with the established topic-specific policy on access control.",
      evidenceGuidance:
        "Application-level access control configurations; database access permissions matrix; file share ACLs; API access token management; data classification-based access rules.",
    },
    {
      identifier: "A.8.4",
      title: "Access to source code",
      category: "Technological Controls",
      description:
        "Read and write access to source code, development tools and software libraries shall be appropriately managed.",
      evidenceGuidance:
        "Source code repository access controls (e.g. GitHub/GitLab permissions); branch protection rules; code review requirements; access audit logs for repositories.",
    },
    {
      identifier: "A.8.5",
      title: "Secure authentication",
      category: "Technological Controls",
      description:
        "Secure authentication technologies and procedures shall be implemented based on information access restrictions and the topic-specific policy on access control.",
      evidenceGuidance:
        "MFA enforcement records; SSO configurations; authentication protocol standards (e.g. OAuth 2.0, SAML); failed login monitoring and lockout policies; passwordless authentication configurations.",
    },
    {
      identifier: "A.8.6",
      title: "Capacity management",
      category: "Technological Controls",
      description:
        "The use of resources shall be monitored and adjusted in line with current and expected capacity requirements.",
      evidenceGuidance:
        "Capacity monitoring dashboards; resource utilization reports; capacity planning documents; auto-scaling configurations; capacity threshold alerts and response procedures.",
    },
    {
      identifier: "A.8.7",
      title: "Protection against malware",
      category: "Technological Controls",
      description:
        "Protection against malware shall be implemented and supported by appropriate user awareness.",
      evidenceGuidance:
        "Anti-malware solution deployment records; signature update schedules and compliance; malware scan results; endpoint detection and response (EDR) alerts; user awareness training on malware.",
    },
    {
      identifier: "A.8.8",
      title: "Management of technical vulnerabilities",
      category: "Technological Controls",
      description:
        "Information about technical vulnerabilities of information systems in use shall be obtained, the organization's exposure to such vulnerabilities shall be evaluated and appropriate measures shall be taken.",
      evidenceGuidance:
        "Vulnerability scanning reports and schedules; patch management records; vulnerability remediation tracking (SLAs by severity); penetration test findings; vulnerability disclosure and response process.",
    },
    {
      identifier: "A.8.9",
      title: "Configuration management",
      category: "Technological Controls",
      description:
        "Configurations, including security configurations, of hardware, software, services and networks shall be established, documented, implemented, monitored and reviewed.",
      evidenceGuidance:
        "Configuration baselines (CIS benchmarks, STIG); configuration management database; configuration drift detection reports; change management records for configuration changes; infrastructure-as-code repositories.",
    },
    {
      identifier: "A.8.10",
      title: "Information deletion",
      category: "Technological Controls",
      description:
        "Information stored in information systems, devices or in any other storage media shall be deleted when no longer required.",
      evidenceGuidance:
        "Data retention and deletion policy; automated data lifecycle management configurations; deletion request logs; certificates of data destruction; retention period compliance reports.",
    },
    {
      identifier: "A.8.11",
      title: "Data masking",
      category: "Technological Controls",
      description:
        "Data masking shall be used in accordance with the organization's topic-specific policy on access control and other related topic-specific policies, and business requirements, taking applicable legislation into consideration.",
      evidenceGuidance:
        "Data masking policy and procedures; masked dataset examples in non-production environments; masking tool configurations; access controls on unmasked data; testing environment data anonymization evidence.",
    },
    {
      identifier: "A.8.12",
      title: "Data leakage prevention",
      category: "Technological Controls",
      description:
        "Data leakage prevention measures shall be applied to systems, networks and any other devices that process, store or transmit sensitive information.",
      evidenceGuidance:
        "DLP tool deployment and policy configurations; DLP incident reports and response actions; email gateway DLP rules; endpoint DLP agent status; cloud DLP configurations (e.g. CASB).",
    },
    {
      identifier: "A.8.13",
      title: "Information backup",
      category: "Technological Controls",
      description:
        "Backup copies of information, software and systems shall be maintained and regularly tested in accordance with the agreed topic-specific policy on backup.",
      evidenceGuidance:
        "Backup policy (frequency, retention, scope); backup job success/failure reports; restore test records and results; offsite/cloud backup configurations; backup encryption evidence.",
    },
    {
      identifier: "A.8.14",
      title: "Redundancy of information processing facilities",
      category: "Technological Controls",
      description:
        "Information processing facilities shall be implemented with redundancy sufficient to meet availability requirements.",
      evidenceGuidance:
        "High availability architecture diagrams; failover test records; redundant system configurations (clustering, load balancing); SLA availability metrics and reports.",
    },
    {
      identifier: "A.8.15",
      title: "Logging",
      category: "Technological Controls",
      description:
        "Logs that record activities, exceptions, faults and other relevant events shall be produced, stored, protected and analysed.",
      evidenceGuidance:
        "Logging policy (what is logged, retention periods); SIEM configurations and dashboards; log integrity protection measures (write-once, hash chains); log storage and access controls; sample audit log reports.",
    },
    {
      identifier: "A.8.16",
      title: "Monitoring activities",
      category: "Technological Controls",
      description:
        "Networks, systems and applications shall be monitored for anomalous behaviour and appropriate actions taken to evaluate potential information security incidents.",
      evidenceGuidance:
        "Monitoring tool configurations (SIEM, IDS/IPS, NDR); alert rules and thresholds; monitoring dashboards; incident correlation and escalation records; SOC operational procedures.",
    },
    {
      identifier: "A.8.17",
      title: "Clock synchronization",
      category: "Technological Controls",
      description:
        "The clocks of information processing systems used by the organization shall be synchronized to approved time sources.",
      evidenceGuidance:
        "NTP server configurations; time synchronization policy; NTP compliance audit results; approved time source documentation (e.g. stratum-1 servers).",
    },
    {
      identifier: "A.8.18",
      title: "Use of privileged utility programs",
      category: "Technological Controls",
      description:
        "The use of utility programs that can be capable of overriding system and application controls shall be restricted and tightly controlled.",
      evidenceGuidance:
        "Privileged utility program inventory; access restrictions on utility programs; usage logging and monitoring; approval procedures for utility program use; periodic review of installed utilities.",
    },
    {
      identifier: "A.8.19",
      title: "Installation of software on operational systems",
      category: "Technological Controls",
      description:
        "Procedures and measures shall be implemented to securely manage software installation on operational systems.",
      evidenceGuidance:
        "Software installation policy; approved software list (whitelist); software deployment change records; application control or allowlisting tool configurations; unauthorized software detection reports.",
    },
    {
      identifier: "A.8.20",
      title: "Networks security",
      category: "Technological Controls",
      description:
        "Networks and network devices shall be secured, managed and controlled to protect information in systems and applications.",
      evidenceGuidance:
        "Network security architecture diagrams; firewall rule sets and review records; network device hardening configurations; network access control (NAC) policies; wireless security configurations.",
    },
    {
      identifier: "A.8.21",
      title: "Security of network services",
      category: "Technological Controls",
      description:
        "Security mechanisms, service levels and service requirements of network services shall be identified, implemented and monitored.",
      evidenceGuidance:
        "Network service agreements with security requirements; SLA monitoring for network services; network service security configurations; managed security service provider (MSSP) contracts and reports.",
    },
    {
      identifier: "A.8.22",
      title: "Segregation of networks",
      category: "Technological Controls",
      description:
        "Groups of information services, users and information systems shall be segregated in the organization's networks.",
      evidenceGuidance:
        "Network segmentation diagrams; VLAN configurations; firewall rules between segments; micro-segmentation policies; DMZ architecture documentation.",
    },
    {
      identifier: "A.8.23",
      title: "Web filtering",
      category: "Technological Controls",
      description:
        "Access to external websites shall be managed to reduce exposure to malicious content.",
      evidenceGuidance:
        "Web filtering policy; URL categorization and blocking configurations; web proxy logs; blocked site reports; exception request and approval records.",
    },
    {
      identifier: "A.8.24",
      title: "Use of cryptography",
      category: "Technological Controls",
      description:
        "Rules for the effective use of cryptography, including cryptographic key management, shall be defined and implemented.",
      evidenceGuidance:
        "Cryptography policy; encryption standards (algorithms, key lengths); key management procedures; TLS/SSL certificate inventory; encryption-at-rest configurations; key rotation schedules.",
    },
    {
      identifier: "A.8.25",
      title: "Secure development life cycle",
      category: "Technological Controls",
      description:
        "Rules for the secure development of software and systems shall be established and applied.",
      evidenceGuidance:
        "Secure SDLC policy; security requirements in user stories or design documents; threat modelling records; security gate reviews; SAST/DAST scan integration in CI/CD pipelines.",
    },
    {
      identifier: "A.8.26",
      title: "Application security requirements",
      category: "Technological Controls",
      description:
        "Information security requirements shall be identified, specified and approved when developing or acquiring applications.",
      evidenceGuidance:
        "Security requirements specifications; application security architecture reviews; security acceptance criteria in development projects; third-party application security assessments.",
    },
    {
      identifier: "A.8.27",
      title: "Secure system architecture and engineering principles",
      category: "Technological Controls",
      description:
        "Principles for engineering secure systems shall be established, documented, maintained and applied to any information system development activities.",
      evidenceGuidance:
        "Secure architecture principles documentation; reference architectures; security design patterns; architecture review board records; defense-in-depth implementation evidence.",
    },
    {
      identifier: "A.8.28",
      title: "Secure coding",
      category: "Technological Controls",
      description: "Secure coding principles shall be applied to software development.",
      evidenceGuidance:
        "Secure coding standards (e.g. OWASP Top 10 coverage); code review checklists with security items; static analysis scan results; developer secure coding training records; peer code review evidence.",
    },
    {
      identifier: "A.8.29",
      title: "Security testing in development and acceptance",
      category: "Technological Controls",
      description:
        "Security testing processes shall be defined and implemented in the development life cycle.",
      evidenceGuidance:
        "Security test plans; SAST/DAST/IAST scan reports; penetration test reports for applications; security acceptance testing sign-off; regression testing evidence after vulnerability fixes.",
    },
    {
      identifier: "A.8.30",
      title: "Outsourced development",
      category: "Technological Controls",
      description:
        "The organization shall direct, monitor and review the activities related to outsourced system development.",
      evidenceGuidance:
        "Outsourced development contracts with security clauses; code escrow agreements; security review of delivered code; third-party developer onboarding security requirements; deliverable acceptance criteria.",
    },
    {
      identifier: "A.8.31",
      title: "Separation of development, test and production environments",
      category: "Technological Controls",
      description:
        "Development, testing and production environments shall be separated and secured.",
      evidenceGuidance:
        "Environment separation architecture diagrams; access control differences between environments; data sanitization procedures for test environments; deployment pipeline configurations enforcing separation.",
    },
    {
      identifier: "A.8.32",
      title: "Change management",
      category: "Technological Controls",
      description:
        "Changes to information processing facilities and information systems shall be subject to change management procedures.",
      evidenceGuidance:
        "Change management policy; change request tickets with approval workflows; CAB meeting minutes; emergency change procedures; change success/failure metrics.",
    },
    {
      identifier: "A.8.33",
      title: "Test information",
      category: "Technological Controls",
      description: "Test information shall be appropriately selected, protected and managed.",
      evidenceGuidance:
        "Test data management procedures; data anonymization evidence for test environments; access controls on test data; prohibition of production data in test environments (or controls when used).",
    },
    {
      identifier: "A.8.34",
      title: "Protection of information systems during audit testing",
      category: "Technological Controls",
      description:
        "Audit tests and other assurance activities involving assessment of operational systems shall be planned and agreed between the tester and appropriate management.",
      evidenceGuidance:
        "Audit test plans with scope and schedule; management approval for audit testing; rules of engagement for penetration tests; audit tool access controls; post-audit cleanup confirmation.",
    },
  ],
};
