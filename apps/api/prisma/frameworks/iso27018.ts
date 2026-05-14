import type { FrameworkDef } from "./index.js";

export const ISO27018_FRAMEWORK: FrameworkDef = {
  name: "ISO/IEC 27018:2019",
  version: "2019",
  description:
    "Code of practice for protection of personally identifiable information (PII) in public clouds acting as PII processors",
  frameworkType: "iso27018",
  requirements: [
    { identifier: "A.1", title: "Consent and choice", category: "PII Protection Principles" },
    {
      identifier: "A.2",
      title: "Purpose legitimacy and specification",
      category: "PII Protection Principles",
    },
    { identifier: "A.3", title: "Collection limitation", category: "PII Protection Principles" },
    { identifier: "A.4", title: "Data minimization", category: "PII Protection Principles" },
    {
      identifier: "A.5",
      title: "Use, retention and disclosure limitation",
      category: "PII Protection Principles",
    },
    { identifier: "A.6", title: "Accuracy and quality", category: "PII Protection Principles" },
    {
      identifier: "A.7",
      title: "Openness, transparency and notice",
      category: "PII Protection Principles",
    },
    {
      identifier: "A.8",
      title: "Individual participation and access",
      category: "PII Protection Principles",
    },
    { identifier: "A.9", title: "Accountability", category: "PII Protection Principles" },
    { identifier: "A.10", title: "Information security", category: "PII Protection Principles" },
    { identifier: "A.11", title: "Privacy compliance", category: "PII Protection Principles" },
    {
      identifier: "5.1-pii",
      title: "Policies for PII protection",
      category: "Cloud PII Processor Controls",
    },
    {
      identifier: "9.2-pii",
      title: "User access management for PII processing",
      category: "Cloud PII Processor Controls",
    },
    {
      identifier: "9.4-pii",
      title: "PII access restrictions",
      category: "Cloud PII Processor Controls",
    },
    {
      identifier: "10.1-pii",
      title: "Cryptographic protection of PII",
      category: "Cloud PII Processor Controls",
    },
    {
      identifier: "11.1-pii",
      title: "Physical protection of PII processing facilities",
      category: "Cloud PII Processor Controls",
    },
    {
      identifier: "12.1-pii",
      title: "Operational procedures for PII processing",
      category: "Cloud PII Processor Controls",
    },
    {
      identifier: "12.3-pii",
      title: "PII data backup and recovery",
      category: "Cloud PII Processor Controls",
    },
    {
      identifier: "12.4-pii",
      title: "Logging and monitoring of PII processing",
      category: "Cloud PII Processor Controls",
    },
    {
      identifier: "13.2-pii",
      title: "PII transfer policies",
      category: "Cloud PII Processor Controls",
    },
    {
      identifier: "16.1-pii",
      title: "PII breach notification",
      category: "Cloud PII Processor Controls",
    },
    {
      identifier: "18.1-pii",
      title: "Legal compliance for PII processing",
      category: "Cloud PII Processor Controls",
    },
  ],
};
