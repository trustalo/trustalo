/**
 * Legacy /dashboard/ai-usage route.
 *
 * The AI usage dashboard moved into Settings → AI Usage. This server
 * component preserves backward compatibility for any bookmarks,
 * deep-links, or external references that still point at the old URL
 * by redirecting them to /settings, where the user can pick the
 * "AI Usage" tab.
 *
 * Once analytics confirm no traffic to this path, the route can be
 * deleted entirely.
 */

import { redirect } from "next/navigation";

export default function AIUsageRedirectPage(): never {
  redirect("/settings");
}
