import { readdir } from "node:fs/promises";
import { join } from "node:path";

const SCHEMA_DIR = join(import.meta.dir, "../prisma/schema");
const OUTPUT_PATH = join(import.meta.dir, "../prisma/schema.prisma");

async function combineSchemas() {
  const files = await readdir(SCHEMA_DIR);
  const prismaFiles = files
    .filter((f) => f.endsWith(".prisma"))
    .sort((a, b) => {
      if (a === "base.prisma") return -1;
      if (b === "base.prisma") return 1;
      return a.localeCompare(b);
    });

  const parts: string[] = [
    "// ============================================================",
    "// AUTO-GENERATED — do not edit manually.",
    "// Run `bun run prisma:combine` to regenerate from prisma/schema/*.prisma",
    "// ============================================================",
    "",
  ];

  for (const file of prismaFiles) {
    const content = await Bun.file(join(SCHEMA_DIR, file)).text();
    parts.push(`// --- ${file} ---`);
    parts.push(content.trim());
    parts.push("");
  }

  await Bun.write(OUTPUT_PATH, parts.join("\n") + "\n");
  console.log(`Combined ${prismaFiles.length} schema files → prisma/schema.prisma`);
}

combineSchemas().catch((err) => {
  console.error("Failed to combine schemas:", err);
  process.exit(1);
});
