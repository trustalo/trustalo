import type { NextConfig } from "next";
import path from "node:path";

// Monorepo root (two levels up from apps/web). Turbopack must be able to read
// from `<root>/node_modules/.bun/` because Bun hoists every dependency there
// and only leaves symlinks in `apps/web/node_modules`. Pinning the root to
// `apps/web` would put those real files outside the allowed tree and trigger
// "We couldn't find the Next.js package" / "files outside of the project
// directory will not be compiled" build errors.
const monorepoRoot = path.resolve(process.cwd(), "..", "..");

// The Content-Security-Policy header is set per-request in
// `src/middleware.ts` so we can inject a fresh nonce on every response.
// Only the static, non-nonce headers live here.
const staticSecurityHeaders = [
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  transpilePackages: ["@trustalo/shared"],
  turbopack: {
    root: monorepoRoot,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: staticSecurityHeaders,
      },
    ];
  },
};

export default nextConfig;
