import type { FrameworkDef } from "./index.js";

export const SOC2_FRAMEWORK: FrameworkDef = {
  name: "SOC 2 Type II",
  version: "2017",
  description:
    "AICPA Trust Service Criteria for Security, Availability, Processing Integrity, Confidentiality, and Privacy",
  frameworkType: "soc2",
  requirements: [
    // CC1 – Control Environment
    {
      identifier: "CC1.1",
      title: "COSO Principle 1: Demonstrates commitment to integrity and ethical values",
      category: "Control Environment",
    },
    {
      identifier: "CC1.2",
      title: "COSO Principle 2: Board exercises oversight responsibility",
      category: "Control Environment",
    },
    {
      identifier: "CC1.3",
      title: "COSO Principle 3: Management establishes structures, reporting lines, and authority",
      category: "Control Environment",
    },
    {
      identifier: "CC1.4",
      title: "COSO Principle 4: Demonstrates commitment to competence",
      category: "Control Environment",
    },
    {
      identifier: "CC1.5",
      title: "COSO Principle 5: Enforces accountability",
      category: "Control Environment",
    },
    // CC2 – Communication and Information
    {
      identifier: "CC2.1",
      title: "COSO Principle 13: Obtains or generates relevant, quality information",
      category: "Communication and Information",
    },
    {
      identifier: "CC2.2",
      title: "COSO Principle 14: Internally communicates information",
      category: "Communication and Information",
    },
    {
      identifier: "CC2.3",
      title: "COSO Principle 15: Communicates with external parties",
      category: "Communication and Information",
    },
    // CC3 – Risk Assessment
    {
      identifier: "CC3.1",
      title: "COSO Principle 6: Specifies suitable objectives",
      category: "Risk Assessment",
    },
    {
      identifier: "CC3.2",
      title: "COSO Principle 7: Identifies and analyzes risk",
      category: "Risk Assessment",
    },
    {
      identifier: "CC3.3",
      title: "COSO Principle 8: Assesses fraud risk",
      category: "Risk Assessment",
    },
    {
      identifier: "CC3.4",
      title: "COSO Principle 9: Identifies and analyzes significant change",
      category: "Risk Assessment",
    },
    // CC4 – Monitoring Activities
    {
      identifier: "CC4.1",
      title: "COSO Principle 16: Selects, develops, and performs ongoing/separate evaluations",
      category: "Monitoring Activities",
    },
    {
      identifier: "CC4.2",
      title: "COSO Principle 17: Evaluates and communicates deficiencies",
      category: "Monitoring Activities",
    },
    // CC5 – Control Activities
    {
      identifier: "CC5.1",
      title: "COSO Principle 10: Selects and develops control activities",
      category: "Control Activities",
    },
    {
      identifier: "CC5.2",
      title: "COSO Principle 11: Selects and develops general controls over technology",
      category: "Control Activities",
    },
    {
      identifier: "CC5.3",
      title: "COSO Principle 12: Deploys through policies and procedures",
      category: "Control Activities",
    },
    // CC6 – Logical and Physical Access Controls
    {
      identifier: "CC6.1",
      title: "Logical access security software, infrastructure, and architectures",
      category: "Logical and Physical Access",
    },
    {
      identifier: "CC6.2",
      title: "Prior to issuing system credentials, registered and authorized",
      category: "Logical and Physical Access",
    },
    {
      identifier: "CC6.3",
      title: "Access to data, software, functions and other IT resources authorized and modified",
      category: "Logical and Physical Access",
    },
    {
      identifier: "CC6.4",
      title: "Physical access to facilities and protected information assets restricted",
      category: "Logical and Physical Access",
    },
    {
      identifier: "CC6.5",
      title: "Logical access to protected information assets discontinued",
      category: "Logical and Physical Access",
    },
    {
      identifier: "CC6.6",
      title: "External threats to information assets managed",
      category: "Logical and Physical Access",
    },
    {
      identifier: "CC6.7",
      title: "Transmission, movement, and removal of information restricted",
      category: "Logical and Physical Access",
    },
    {
      identifier: "CC6.8",
      title: "Controls to prevent or detect introduction of unauthorized or malicious software",
      category: "Logical and Physical Access",
    },
    // CC7 – System Operations
    {
      identifier: "CC7.1",
      title: "Detection and monitoring procedures detect anomalies indicative of threats",
      category: "System Operations",
    },
    {
      identifier: "CC7.2",
      title: "Incidents are monitored and procedures exist to identify security incidents",
      category: "System Operations",
    },
    {
      identifier: "CC7.3",
      title: "Security incidents evaluated to determine impact",
      category: "System Operations",
    },
    {
      identifier: "CC7.4",
      title: "Affected parties are notified of security incidents",
      category: "System Operations",
    },
    {
      identifier: "CC7.5",
      title: "Root cause of incident is identified and remediation actions taken",
      category: "System Operations",
    },
    // CC8 – Change Management
    {
      identifier: "CC8.1",
      title:
        "Changes to infrastructure, data, software and procedures authorized, designed, developed, configured, documented, tested, approved, and implemented",
      category: "Change Management",
    },
    // CC9 – Risk Mitigation
    {
      identifier: "CC9.1",
      title: "Risk mitigation activities are identified and assessed",
      category: "Risk Mitigation",
    },
    {
      identifier: "CC9.2",
      title: "Vendor and business partner risks managed",
      category: "Risk Mitigation",
    },
    // A – Availability
    {
      identifier: "A1.1",
      title: "Current processing capacity and usage maintained and monitored",
      category: "Availability",
    },
    {
      identifier: "A1.2",
      title: "Environmental protections, software, data backup, and recovery infrastructure",
      category: "Availability",
    },
    {
      identifier: "A1.3",
      title: "Recovery plan tests conducted and results communicated",
      category: "Availability",
    },
    // PI – Processing Integrity
    {
      identifier: "PI1.1",
      title: "Procedures to define processing specifications",
      category: "Processing Integrity",
    },
    {
      identifier: "PI1.2",
      title: "System inputs are complete, accurate, and processed timely",
      category: "Processing Integrity",
    },
    {
      identifier: "PI1.3",
      title: "System processing complete, valid, accurate, timely, and authorized",
      category: "Processing Integrity",
    },
    {
      identifier: "PI1.4",
      title: "System outputs complete, accurate, distributed, and retained",
      category: "Processing Integrity",
    },
    {
      identifier: "PI1.5",
      title: "Inputs and processing stored completely, accurately, and timely",
      category: "Processing Integrity",
    },
    // C – Confidentiality
    {
      identifier: "C1.1",
      title:
        "Confidential information identified and protected during collection, creation, and processing",
      category: "Confidentiality",
    },
    {
      identifier: "C1.2",
      title: "Confidential information disposed to meet entity's objectives",
      category: "Confidentiality",
    },
    // P – Privacy
    {
      identifier: "P1.1",
      title: "Privacy notice provided at or before collection",
      category: "Privacy",
    },
    {
      identifier: "P2.1",
      title: "Personal information collected is consistent with objectives",
      category: "Privacy",
    },
    {
      identifier: "P3.1",
      title: "Personal information retained and then disposed as defined",
      category: "Privacy",
    },
    {
      identifier: "P3.2",
      title: "Personal information retained for no longer than needed",
      category: "Privacy",
    },
    {
      identifier: "P4.1",
      title: "Personal information used only for identified purposes",
      category: "Privacy",
    },
    {
      identifier: "P4.2",
      title: "Personal information retained only for stated purposes",
      category: "Privacy",
    },
    {
      identifier: "P4.3",
      title: "Personal information disclosed to third parties only as stated",
      category: "Privacy",
    },
    {
      identifier: "P5.1",
      title: "Personal information access, corrections, and related requests handled",
      category: "Privacy",
    },
    {
      identifier: "P5.2",
      title: "Requests for access, correction, and complaints addressed timely",
      category: "Privacy",
    },
    {
      identifier: "P6.1",
      title: "Personal information disclosed only to third parties with consent or stated purposes",
      category: "Privacy",
    },
    {
      identifier: "P6.2",
      title: "Records of disclosures to third parties are complete, accurate, and timely",
      category: "Privacy",
    },
    {
      identifier: "P6.3",
      title: "Unauthorized disclosures of personal information identified",
      category: "Privacy",
    },
    {
      identifier: "P6.4",
      title: "Third parties are assessed for compliance with privacy commitments",
      category: "Privacy",
    },
    {
      identifier: "P6.5",
      title: "Personal information obtained from third parties is obtained with consent",
      category: "Privacy",
    },
    {
      identifier: "P7.1",
      title: "Types of personal information collected and methods are consistent with commitments",
      category: "Privacy",
    },
    {
      identifier: "P8.1",
      title: "Complaints and disputes relating to privacy are addressed timely",
      category: "Privacy",
    },
  ],
};
