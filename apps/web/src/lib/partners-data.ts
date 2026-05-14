/**
 * Static catalog of VAPT and Audit partners shown in the Partners directory.
 *
 * This is a curated, app-wide list (not tenant-scoped) intentionally kept as
 * a flat seed file for the MVP. To promote to a real backend later:
 *   1. Move the `Partner` type and enums into a Prisma model + migration.
 *   2. Replace the in-memory `PARTNERS` constant with API calls
 *      (e.g. apiClient.listPartners()).
 *   3. Add an admin-only CRUD surface for sponsors/Trustalo ops to manage
 *      sponsorship tiers and listings.
 *
 * Sponsored entries are pinned to the top of the listing UI and rendered
 * with a "Sponsored" badge. `sponsorTier` controls relative ordering within
 * the sponsored block (gold > silver > bronze).
 */

export type PartnerServiceType =
  | "vapt"
  | "internal_audit"
  | "external_audit"
  | "certification"
  | "privacy_audit";

export const PARTNER_SERVICE_LABELS: Record<PartnerServiceType, string> = {
  vapt: "VAPT",
  internal_audit: "Internal Audit",
  external_audit: "External Audit",
  certification: "Certification",
  privacy_audit: "Privacy Audit",
};

export type SponsorTier = "gold" | "silver" | "bronze";

export const SPONSOR_TIER_RANK: Record<SponsorTier, number> = {
  gold: 0,
  silver: 1,
  bronze: 2,
};

export interface PartnerContact {
  email?: string;
  phone?: string;
  contactPerson?: string;
}

export interface Partner {
  id: string;
  name: string;
  /** Optional logo URL. When omitted the UI falls back to initials. */
  logoUrl?: string;
  website?: string;
  /** Short marketing blurb (1–3 sentences). */
  description: string;
  /** ISO country name or region label, e.g. "Singapore" or "EMEA". */
  region?: string;
  serviceTypes: PartnerServiceType[];
  /** Free-form industry/domain tags, e.g. "Fintech", "Healthcare". */
  specializations: string[];
  contact: PartnerContact;
  sponsored?: boolean;
  sponsorTier?: SponsorTier;
}

// ────────────────────────────────────────────────────────────────────
// Seed data
//
// NOTE: Two kinds of entries below.
//   1. `sponsored: true` entries are placeholders for paid Trustalo
//      partners. Replace `name`, `description`, `website`, and `contact`
//      with verified information once each partnership is signed.
//   2. The "known providers" block at the bottom (BSI, SGS, DNV, etc.)
//      lists well-known certification bodies and audit firms as an
//      industry directory. They are NOT affiliated with Trustalo unless
//      explicitly marked sponsored. Listings reference each provider's
//      registered trade name; logos are loaded by domain via the
//      Clearbit Logo API for convenience. For a production launch,
//      download/self-host the logos under `apps/web/public/partners/`
//      and update each `logoUrl` to a local path to remove the runtime
//      third-party dependency.
// ────────────────────────────────────────────────────────────────────

/** Helper for building a Clearbit logo URL from a domain. */
function clearbitLogo(domain: string): string {
  return `https://logo.clearbit.com/${domain}`;
}

export const PARTNERS: Partner[] = [
  {
    id: "sentinel-redteam",
    name: "Sentinel Red Team",
    website: "https://example.com/sentinel-redteam",
    description:
      "Boutique offensive security firm specialising in web, mobile, and cloud penetration testing for high-growth SaaS companies.",
    region: "Singapore",
    serviceTypes: ["vapt"],
    specializations: ["SaaS", "Fintech", "Cloud"],
    contact: {
      email: "hello@example.com",
      contactPerson: "Sample Contact",
    },
    sponsored: true,
    sponsorTier: "gold",
  },
  {
    id: "northstar-assurance",
    name: "NorthStar Assurance",
    website: "https://example.com/northstar-assurance",
    description:
      "ISO 27001, SOC 2, and ISO 42001 certification body with a track record across APAC and Middle East engagements.",
    region: "APAC",
    serviceTypes: ["certification", "external_audit"],
    specializations: ["ISO 27001", "SOC 2", "ISO 42001"],
    contact: {
      email: "partners@example.com",
    },
    sponsored: true,
    sponsorTier: "silver",
  },
  {
    id: "atlas-internal-audit",
    name: "Atlas Internal Audit",
    website: "https://example.com/atlas",
    description:
      "Co-sourced internal audit and risk advisory for regulated industries — banking, insurance, and healthcare.",
    region: "EMEA",
    serviceTypes: ["internal_audit"],
    specializations: ["Banking", "Insurance", "Healthcare"],
    contact: {
      email: "audit@example.com",
      phone: "+44 20 0000 0000",
    },
  },
  {
    id: "privacycraft",
    name: "PrivacyCraft",
    website: "https://example.com/privacycraft",
    description:
      "GDPR, PDPA, and CCPA privacy assessments delivered by certified DPOs. Includes DPIAs and ROPA reviews.",
    region: "Global",
    serviceTypes: ["privacy_audit"],
    specializations: ["GDPR", "PDPA", "CCPA", "Healthcare"],
    contact: {
      email: "dpo@example.com",
      contactPerson: "Sample DPO",
    },
  },
  {
    id: "ironhive-pentest",
    name: "IronHive Pentest Co.",
    website: "https://example.com/ironhive",
    description:
      "CREST-aligned penetration testing covering external, internal, wireless, and red-team simulations.",
    region: "EMEA",
    serviceTypes: ["vapt"],
    specializations: ["Network", "Red Team", "Wireless"],
    contact: {
      email: "ops@example.com",
    },
  },
  {
    id: "verdant-soc-audit",
    name: "Verdant SOC Audit",
    website: "https://example.com/verdant",
    description:
      "AICPA-licensed CPA firm specialising in SOC 1, SOC 2 Type I/II, and HITRUST audits for SaaS providers.",
    region: "North America",
    serviceTypes: ["external_audit", "certification"],
    specializations: ["SOC 2", "SOC 1", "HITRUST"],
    contact: {
      email: "engagements@example.com",
      contactPerson: "Sample Partner",
    },
    sponsored: true,
    sponsorTier: "bronze",
  },

  // ──────────────────────────────────────────────────────────────────
  // Known providers — internationally recognised certification bodies
  // and audit firms. Not sponsored / not affiliated with Trustalo.
  // ──────────────────────────────────────────────────────────────────
  {
    id: "intertek-sai-global",
    name: "Intertek SAI Global",
    logoUrl: clearbitLogo("saiassurance.com.au"),
    website: "https://www.saiassurance.com.au",
    description:
      "Accredited certification body (formerly SAI Global, acquired by Intertek) offering management-system certifications across ISO 27001, ISO 9001, ISO 14001, and ISO 45001.",
    region: "Global",
    serviceTypes: ["certification", "external_audit"],
    specializations: ["ISO 27001", "ISO 9001", "ISO 14001", "ISO 45001"],
    contact: {},
  },
  {
    id: "bsi",
    name: "BSI (British Standards Institution)",
    logoUrl: clearbitLogo("bsigroup.com"),
    website: "https://www.bsigroup.com",
    description:
      "UK national standards body and global certification provider. Issues accredited ISO certifications and offers training, assurance, and supply-chain advisory services.",
    region: "Global (HQ United Kingdom)",
    serviceTypes: ["certification", "external_audit"],
    specializations: ["ISO 27001", "ISO 9001", "ISO 22301", "ISO 14001", "ISO 45001"],
    contact: {},
  },
  {
    id: "sgs",
    name: "SGS",
    logoUrl: clearbitLogo("sgs.com"),
    website: "https://www.sgs.com",
    description:
      "Geneva-based testing, inspection, and certification group. Operates an accredited certification body issuing ISO management-system certificates worldwide.",
    region: "Global (HQ Switzerland)",
    serviceTypes: ["certification", "external_audit"],
    specializations: ["ISO 27001", "ISO 9001", "ISO 14001", "ISO 45001", "ISO 22301"],
    contact: {},
  },
  {
    id: "tqcsi",
    name: "TQCSI",
    logoUrl: clearbitLogo("tqcsi.com"),
    website: "https://www.tqcsi.com",
    description:
      "Total Quality Certification Services International — JAS-ANZ accredited certification body headquartered in Australia, with a global network of auditors.",
    region: "APAC (HQ Australia)",
    serviceTypes: ["certification"],
    specializations: ["ISO 27001", "ISO 9001", "ISO 14001", "ISO 45001"],
    contact: {},
  },
  {
    id: "dnv",
    name: "DNV",
    logoUrl: clearbitLogo("dnv.com"),
    website: "https://www.dnv.com",
    description:
      "Independent assurance and risk-management provider (formerly DNV GL). Delivers accredited management-system certification and cyber-security advisory across regulated industries.",
    region: "Global (HQ Norway)",
    serviceTypes: ["certification", "external_audit"],
    specializations: ["ISO 27001", "ISO 9001", "ISO 14001", "ISO 45001", "Maritime", "Energy"],
    contact: {},
  },
  {
    id: "kpmg",
    name: "KPMG",
    logoUrl: clearbitLogo("kpmg.com"),
    website: "https://kpmg.com",
    description:
      "Big Four professional-services firm. Provides external financial audit, internal audit co-sourcing, IT/SOC audits, and cyber-security advisory through KPMG Cyber.",
    region: "Global",
    serviceTypes: ["external_audit", "internal_audit"],
    specializations: ["SOC 1", "SOC 2", "Financial Audit", "Cyber Advisory"],
    contact: {},
  },
];

// ────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────

/**
 * Returns the union of every specialization across the catalog so the
 * filter dropdown stays in sync with the seed data automatically.
 */
export function getAllSpecializations(partners: Partner[] = PARTNERS): string[] {
  const set = new Set<string>();
  for (const p of partners) {
    for (const s of p.specializations) set.add(s);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

/**
 * Sorts partners with sponsored entries first (ordered by tier), then
 * the rest alphabetically by name. Stable for a given input.
 */
export function sortPartners(partners: Partner[]): Partner[] {
  return [...partners].sort((a, b) => {
    const aSponsored = a.sponsored ? 1 : 0;
    const bSponsored = b.sponsored ? 1 : 0;
    if (aSponsored !== bSponsored) return bSponsored - aSponsored;
    if (a.sponsored && b.sponsored) {
      const aRank = a.sponsorTier ? SPONSOR_TIER_RANK[a.sponsorTier] : 99;
      const bRank = b.sponsorTier ? SPONSOR_TIER_RANK[b.sponsorTier] : 99;
      if (aRank !== bRank) return aRank - bRank;
    }
    return a.name.localeCompare(b.name);
  });
}
