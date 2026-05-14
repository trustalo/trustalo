/**
 * Phase 2 (AI accelerators): public Trust Center is now a Server Component
 * shell. It fetches the org's payload directly from the API on the server
 * with `next: { revalidate: 300 }` so:
 *
 *   1. The HTML is fully rendered before hitting the browser, which gives
 *      better TTFB / SEO than the previous client-side fetch flow.
 *   2. Repeat hits within a 5 min window are served from Next's data cache
 *      (matching the API's own `Cache-Control: s-maxage=300`).
 *   3. Interactive bits (resource downloads, access-request modal) live
 *      in `TrustCenterClient` so the page stays mostly static.
 */

import { notFound } from "next/navigation";
import type { PublicTrustCenterData } from "@/lib/api-client";
import TrustCenterClient from "./trust-center-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export const revalidate = 300;

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function fetchTrustCenter(slug: string): Promise<PublicTrustCenterData | null> {
  const res = await fetch(`${API_URL}/api/v1/trust-center/public/${encodeURIComponent(slug)}`, {
    // Honour the API's `s-maxage=300` (matches `revalidate` above).
    next: { revalidate: 300, tags: [`trust-center:${slug}`] },
  });

  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Failed to load Trust Center (${res.status})`);
  }

  const json = (await res.json()) as { success: boolean; data: PublicTrustCenterData };
  return json.data;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const data = await fetchTrustCenter(slug).catch(() => null);
  if (!data) return { title: "Trust Center" };
  return {
    title: `${data.organization.name} · Trust Center`,
    description:
      data.config.description ??
      `Compliance, security, and privacy posture for ${data.organization.name}.`,
  };
}

export default async function PublicTrustCenterPage({ params }: PageProps) {
  const { slug } = await params;
  const data = await fetchTrustCenter(slug);
  if (!data) notFound();

  return <TrustCenterClient slug={slug} data={data} />;
}
