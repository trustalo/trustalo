import type { FrameworkDef } from "./index.js";

export const ISO22301_FRAMEWORK: FrameworkDef = {
  name: "ISO 22301:2019",
  version: "2019",
  description: "Security and resilience — Business continuity management systems — Requirements",
  frameworkType: "iso22301",
  requirements: [
    {
      identifier: "4.1",
      title: "Understanding the organization and its context",
      category: "Context of the Organization",
    },
    {
      identifier: "4.2",
      title: "Understanding the needs and expectations of interested parties",
      category: "Context of the Organization",
    },
    {
      identifier: "4.3",
      title: "Determining the scope of the BCMS",
      category: "Context of the Organization",
    },
    {
      identifier: "4.4",
      title: "Business continuity management system",
      category: "Context of the Organization",
    },
    { identifier: "5.1", title: "Leadership and commitment", category: "Leadership" },
    { identifier: "5.2", title: "Policy", category: "Leadership" },
    {
      identifier: "5.3",
      title: "Organizational roles, responsibilities and authorities",
      category: "Leadership",
    },
    {
      identifier: "6.1",
      title: "Actions to address risks and opportunities",
      category: "Planning",
    },
    {
      identifier: "6.2",
      title: "Business continuity objectives and plans to achieve them",
      category: "Planning",
    },
    { identifier: "6.3", title: "Planning of changes to the BCMS", category: "Planning" },
    { identifier: "7.1", title: "Resources", category: "Support" },
    { identifier: "7.2", title: "Competence", category: "Support" },
    { identifier: "7.3", title: "Awareness", category: "Support" },
    { identifier: "7.4", title: "Communication", category: "Support" },
    { identifier: "7.5", title: "Documented information", category: "Support" },
    { identifier: "8.1", title: "Operational planning and control", category: "Operation" },
    {
      identifier: "8.2",
      title: "Business impact analysis and risk assessment",
      category: "Operation",
    },
    {
      identifier: "8.3",
      title: "Business continuity strategies and solutions",
      category: "Operation",
    },
    { identifier: "8.4", title: "Business continuity plans and procedures", category: "Operation" },
    { identifier: "8.5", title: "Exercise programme", category: "Operation" },
    {
      identifier: "8.6",
      title: "Evaluation of business continuity documentation and capabilities",
      category: "Operation",
    },
    {
      identifier: "9.1",
      title: "Monitoring, measurement, analysis and evaluation",
      category: "Performance Evaluation",
    },
    { identifier: "9.2", title: "Internal audit", category: "Performance Evaluation" },
    { identifier: "9.3", title: "Management review", category: "Performance Evaluation" },
    { identifier: "10.1", title: "Nonconformity and corrective action", category: "Improvement" },
    { identifier: "10.2", title: "Continual improvement", category: "Improvement" },
  ],
};
