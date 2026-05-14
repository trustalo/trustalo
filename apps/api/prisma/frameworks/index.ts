export interface RequirementDef {
  identifier: string;
  title: string;
  category: string;
  description?: string;
  evidenceGuidance?: string;
  // Optional maturity/tier marker for tiered frameworks
  // (e.g. Essential Eight: "ml1"/"ml2"/"ml3"). Maps to Requirement.maturityLevel.
  maturityLevel?: string;
}

export interface FrameworkDef {
  name: string;
  version: string;
  description: string;
  frameworkType:
    | "iso27001"
    | "iso27017"
    | "iso27018"
    | "iso22301"
    | "iso42001"
    | "soc2"
    | "essential8"
    | "nist_csf_2"
    | "gdpr";
  requirements: RequirementDef[];
}

export { ISO27001_FRAMEWORK } from "./iso27001.js";
export { ISO27017_FRAMEWORK } from "./iso27017.js";
export { ISO27018_FRAMEWORK } from "./iso27018.js";
export { ISO22301_FRAMEWORK } from "./iso22301.js";
export { ISO42001_FRAMEWORK } from "./iso42001.js";
export { SOC2_FRAMEWORK } from "./soc2.js";
export { ESSENTIAL8_FRAMEWORK } from "./essential8.js";
export { NIST_CSF_2_FRAMEWORK } from "./nist-csf-2.js";
export { GDPR_FRAMEWORK } from "./gdpr.js";
