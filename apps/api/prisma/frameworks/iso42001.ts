import type { FrameworkDef } from "./index.js";

export const ISO42001_FRAMEWORK: FrameworkDef = {
  name: "ISO/IEC 42001:2023",
  version: "2023",
  description: "Information technology — Artificial intelligence — Management system",
  frameworkType: "iso42001",
  requirements: [
    {
      identifier: "4.1",
      title: "Understanding the organization and its context (AI)",
      category: "Context of the Organization",
    },
    {
      identifier: "4.2",
      title: "Understanding the needs and expectations of interested parties (AI)",
      category: "Context of the Organization",
    },
    {
      identifier: "4.3",
      title: "Determining the scope of the AIMS",
      category: "Context of the Organization",
    },
    { identifier: "4.4", title: "AI management system", category: "Context of the Organization" },
    { identifier: "5.1", title: "Leadership and commitment (AI)", category: "Leadership" },
    { identifier: "5.2", title: "AI policy", category: "Leadership" },
    {
      identifier: "5.3",
      title: "Roles, responsibilities and authorities (AI)",
      category: "Leadership",
    },
    {
      identifier: "6.1",
      title: "Actions to address risks and opportunities (AI)",
      category: "Planning",
    },
    {
      identifier: "6.2",
      title: "AI objectives and planning to achieve them",
      category: "Planning",
    },
    { identifier: "7.1", title: "Resources (AI)", category: "Support" },
    { identifier: "7.2", title: "Competence (AI)", category: "Support" },
    { identifier: "7.3", title: "Awareness (AI)", category: "Support" },
    { identifier: "7.4", title: "Communication (AI)", category: "Support" },
    { identifier: "7.5", title: "Documented information (AI)", category: "Support" },
    { identifier: "8.1", title: "Operational planning and control (AI)", category: "Operation" },
    { identifier: "8.2", title: "AI risk assessment", category: "Operation" },
    { identifier: "8.3", title: "AI risk treatment", category: "Operation" },
    { identifier: "8.4", title: "AI system impact assessment", category: "Operation" },
    {
      identifier: "9.1",
      title: "Monitoring, measurement, analysis and evaluation (AI)",
      category: "Performance Evaluation",
    },
    { identifier: "9.2", title: "Internal audit (AI)", category: "Performance Evaluation" },
    { identifier: "9.3", title: "Management review (AI)", category: "Performance Evaluation" },
    { identifier: "10.1", title: "Continual improvement (AI)", category: "Improvement" },
    {
      identifier: "10.2",
      title: "Nonconformity and corrective action (AI)",
      category: "Improvement",
    },
    // Annex A – AI Controls
    { identifier: "A.2", title: "AI policies", category: "AI Controls (Annex A)" },
    { identifier: "A.3", title: "Internal organization for AI", category: "AI Controls (Annex A)" },
    { identifier: "A.4", title: "Resources for AI systems", category: "AI Controls (Annex A)" },
    {
      identifier: "A.5",
      title: "Assessing impacts of AI systems",
      category: "AI Controls (Annex A)",
    },
    { identifier: "A.6", title: "AI system life cycle", category: "AI Controls (Annex A)" },
    { identifier: "A.7", title: "Data for AI systems", category: "AI Controls (Annex A)" },
    {
      identifier: "A.8",
      title: "Information for interested parties of AI systems",
      category: "AI Controls (Annex A)",
    },
    { identifier: "A.9", title: "Use of AI systems", category: "AI Controls (Annex A)" },
    {
      identifier: "A.10",
      title: "Third-party and customer relationships",
      category: "AI Controls (Annex A)",
    },
  ],
};
