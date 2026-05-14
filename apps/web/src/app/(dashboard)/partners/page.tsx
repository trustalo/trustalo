"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  PARTNERS,
  PARTNER_SERVICE_LABELS,
  getAllSpecializations,
  sortPartners,
  type Partner,
  type PartnerServiceType,
  type SponsorTier,
} from "@/lib/partners-data";

const SERVICE_OPTIONS: { value: PartnerServiceType; label: string }[] = (
  Object.keys(PARTNER_SERVICE_LABELS) as PartnerServiceType[]
).map((value) => ({ value, label: PARTNER_SERVICE_LABELS[value] }));

const SPONSOR_BADGE: Record<SponsorTier, { label: string; className: string }> = {
  gold: {
    label: "Sponsored · Gold",
    className:
      "bg-amber-100 text-amber-800 ring-amber-600/30 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-400/30",
  },
  silver: {
    label: "Sponsored · Silver",
    className:
      "bg-neutral-200 text-neutral-700 ring-neutral-500/30 dark:bg-neutral-800 dark:text-neutral-300 dark:ring-neutral-400/30",
  },
  bronze: {
    label: "Sponsored · Bronze",
    className:
      "bg-orange-100 text-orange-800 ring-orange-600/30 dark:bg-orange-950 dark:text-orange-300 dark:ring-orange-400/30",
  },
};

export default function PartnersPage() {
  const [search, setSearch] = useState("");
  const [serviceFilter, setServiceFilter] = useState<string>("");
  const [specializationFilter, setSpecializationFilter] = useState<string>("");

  const allSpecializations = useMemo(() => getAllSpecializations(), []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const matches = PARTNERS.filter((p) => {
      if (serviceFilter && !p.serviceTypes.includes(serviceFilter as PartnerServiceType)) {
        return false;
      }
      if (specializationFilter && !p.specializations.includes(specializationFilter)) {
        return false;
      }
      if (q) {
        const haystack = [
          p.name,
          p.description,
          p.region ?? "",
          p.specializations.join(" "),
          p.serviceTypes.map((s) => PARTNER_SERVICE_LABELS[s]).join(" "),
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
    return sortPartners(matches);
  }, [search, serviceFilter, specializationFilter]);

  const sponsored = filtered.filter((p) => p.sponsored);
  const standard = filtered.filter((p) => !p.sponsored);
  const hasFilters = search || serviceFilter || specializationFilter;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Partners</h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Industry directory of VAPT and audit providers. Entries marked “Sponsored” are official
            Trustalo partners; others are listed for convenience and are not affiliated with
            Trustalo.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="w-72">
          <Input
            id="partners-search"
            placeholder="Search partners, services, regions…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-56">
          <Select
            id="partners-service"
            options={SERVICE_OPTIONS}
            placeholder="All services"
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
          />
        </div>
        <div className="w-56">
          <Select
            id="partners-specialization"
            options={allSpecializations.map((s) => ({ value: s, label: s }))}
            placeholder="All specializations"
            value={specializationFilter}
            onChange={(e) => setSpecializationFilter(e.target.value)}
          />
        </div>
        {hasFilters && (
          <button
            type="button"
            className="text-sm text-blue-600 hover:underline dark:text-blue-400"
            onClick={() => {
              setSearch("");
              setServiceFilter("");
              setSpecializationFilter("");
            }}
          >
            Clear filters
          </button>
        )}
        <span className="ml-auto text-sm text-neutral-500 dark:text-neutral-400">
          {filtered.length} partner{filtered.length === 1 ? "" : "s"}
        </span>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <Card>
          <div className="py-10 text-center">
            <p className="text-neutral-500 dark:text-neutral-400">
              {hasFilters ? "No partners match your filters." : "No partners listed yet."}
            </p>
          </div>
        </Card>
      )}

      {/* Sponsored block */}
      {sponsored.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Featured partners
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {sponsored.map((p) => (
              <PartnerCard key={p.id} partner={p} />
            ))}
          </div>
        </section>
      )}

      {/* Standard block */}
      {standard.length > 0 && (
        <section className="space-y-3">
          {sponsored.length > 0 && (
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              All partners
            </h2>
          )}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {standard.map((p) => (
              <PartnerCard key={p.id} partner={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// Partner card
// ────────────────────────────────────────────────────────────────────

function PartnerCard({ partner }: { partner: Partner }) {
  const tierBadge = partner.sponsored ? SPONSOR_BADGE[partner.sponsorTier ?? "bronze"] : null;

  return (
    <Card className="flex h-full flex-col">
      <div className="flex items-start gap-3">
        <PartnerAvatar partner={partner} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-semibold text-neutral-900 dark:text-white">
              {partner.name}
            </h3>
            {tierBadge && (
              <span
                className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset ${tierBadge.className}`}
              >
                {tierBadge.label}
              </span>
            )}
          </div>
          {partner.region && (
            <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
              {partner.region}
            </p>
          )}
        </div>
      </div>

      <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-300">{partner.description}</p>

      {partner.serviceTypes.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {partner.serviceTypes.map((s) => (
            <Badge key={s} variant="info">
              {PARTNER_SERVICE_LABELS[s]}
            </Badge>
          ))}
        </div>
      )}

      {partner.specializations.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {partner.specializations.map((s) => (
            <Badge key={s} variant="neutral">
              {s}
            </Badge>
          ))}
        </div>
      )}

      <div className="mt-auto flex flex-wrap items-center gap-3 pt-4 text-sm">
        {partner.website && (
          <a
            href={partner.website}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            Visit website ↗
          </a>
        )}
        {partner.contact.email && (
          <a
            href={`mailto:${partner.contact.email}`}
            className="font-medium text-neutral-700 hover:underline dark:text-neutral-200"
          >
            {partner.contact.email}
          </a>
        )}
        {partner.contact.phone && (
          <span className="text-neutral-500 dark:text-neutral-400">{partner.contact.phone}</span>
        )}
      </div>

      {partner.contact.contactPerson && (
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          Contact: {partner.contact.contactPerson}
        </p>
      )}
    </Card>
  );
}

function PartnerAvatar({ partner }: { partner: Partner }) {
  // Externally-hosted logos (e.g. via the Clearbit Logo API) can 404 or
  // get blocked. Track a failure flag so we can fall back to initials
  // without a broken-image icon flashing in the card.
  const [imgFailed, setImgFailed] = useState(false);

  const initials =
    partner.name
      .split(" ")
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";

  if (partner.logoUrl && !imgFailed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={partner.logoUrl}
        alt={`${partner.name} logo`}
        loading="lazy"
        onError={() => setImgFailed(true)}
        className="h-10 w-10 shrink-0 rounded-md bg-white object-contain p-0.5 ring-1 ring-neutral-200 dark:bg-neutral-100 dark:ring-neutral-700"
      />
    );
  }

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-semibold text-white">
      {initials}
    </div>
  );
}
