// Barrel for @trustalo/shared.
//
// Re-exports use extensionless paths intentionally:
//   - tsconfig sets `moduleResolution: "bundler"`, which resolves these to
//     `<name>/index.ts` for the TS compiler and editors.
//   - Bun's runtime (used by apps/api and apps/collector) resolves `.ts`
//     directly with no extension.
//   - Turbopack (used by apps/web via `transpilePackages`) resolves them via
//     its standard extension list (.ts, .tsx, .js, ...).
//
// Do NOT add explicit `.js` extensions here. Turbopack does not rewrite `.js`
// → `.ts` for transpiled workspace packages, which would break `next dev`.
export * from "./types";
export * from "./schemas";
export * from "./constants";
export * from "./utils";
