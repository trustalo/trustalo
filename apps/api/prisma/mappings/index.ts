/**
 * Cross-framework requirement mapping registry.
 *
 * Each entry is a JSON document of `{ sourceFramework, targetFramework,
 * source, mappings: [{ source, target, relationship, rationale }] }`.
 * The seeder resolves source/target to Requirement IDs by `(frameworkType,
 * identifier)` and upserts FrameworkRequirementMapping rows.
 *
 * Adding a new mapping set requires only:
 *   1. dropping a JSON file alongside this index
 *   2. importing it below and pushing into MAPPINGS
 *
 * The loader is idempotent and safe to re-run.
 */
import e8ToIso from "./essential8_to_iso27001.json" with { type: "json" };
import e8ToSoc2 from "./essential8_to_soc2.json" with { type: "json" };
import csfToIso from "./nist-csf-2_to_iso27001.json" with { type: "json" };
import e8ToCsf from "./essential8_to_nist-csf-2.json" with { type: "json" };
import soc2ToIso from "./soc2_to_iso27001.json" with { type: "json" };
import gdprToIso from "./gdpr_to_iso27001.json" with { type: "json" };
import gdprToSoc2 from "./gdpr_to_soc2.json" with { type: "json" };
import cps234ToIso from "./cps234_to_iso27001.json" with { type: "json" };
import hipaaToIso from "./hipaa_to_iso27001.json" with { type: "json" };
import hipaaToSoc2 from "./hipaa_to_soc2.json" with { type: "json" };
import pciDss4ToIso from "./pci-dss-4_to_iso27001.json" with { type: "json" };
import pciDss4ToSoc2 from "./pci-dss-4_to_soc2.json" with { type: "json" };

export type MappingRelationship = "equivalent" | "partial" | "informs";

export interface FrameworkMappingEntry {
  source: string; // source requirement identifier
  target: string; // target requirement identifier
  relationship: MappingRelationship;
  rationale?: string;
}

export interface FrameworkMappingSet {
  source: string; // citation for the mapping (e.g. AICPA TSC)
  sourceFramework: string;
  targetFramework: string;
  mappings: FrameworkMappingEntry[];
}

export const MAPPINGS: FrameworkMappingSet[] = [
  e8ToIso as FrameworkMappingSet,
  e8ToSoc2 as FrameworkMappingSet,
  csfToIso as FrameworkMappingSet,
  e8ToCsf as FrameworkMappingSet,
  soc2ToIso as FrameworkMappingSet,
  gdprToIso as FrameworkMappingSet,
  gdprToSoc2 as FrameworkMappingSet,
  cps234ToIso as FrameworkMappingSet,
  hipaaToIso as FrameworkMappingSet,
  hipaaToSoc2 as FrameworkMappingSet,
  pciDss4ToIso as FrameworkMappingSet,
  pciDss4ToSoc2 as FrameworkMappingSet,
];
