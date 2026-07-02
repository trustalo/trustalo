/**
 * Auditor handoff package ("audit package") builder.
 *
 * Assembles a per-framework-instance ZIP containing everything an external
 * auditor needs to start fieldwork:
 *
 *   manifest.json        — generated-at, framework name/version, org name,
 *                          control counts by status, evidence counts,
 *                          package format version
 *   controls.csv         — one row per mapped requirement: identifier,
 *                          title, category, control status, owner, linked
 *                          evidence ids
 *   soa.csv              — Statement of Applicability derived from the same
 *                          mapping (applicable = control not marked
 *                          not_applicable, with the control's
 *                          implementation details as justification)
 *   evidence/index.csv   — evidence metadata incl. the in-zip filename (or
 *                          the reason a file was left out)
 *   evidence/files/…     — the stored files for APPROVED evidence
 *
 * The builder is deliberately decoupled from Prisma: the router loads
 * tenant-scoped rows and hands plain data structures to
 * `assembleAuditPackage`, which only needs a minimal storage surface
 * (`exists` + `download`) so unit tests run fully in-memory.
 *
 * Evidence files are attached to the ZIP as *lazy* Node streams: the
 * storage download for a file starts only when JSZip's generator reaches
 * that entry (JSZip resumes each input stream sequentially during
 * `generateNodeStream`), so the API process never buffers the whole
 * package and no idle S3 connections are held open. Files above the
 * per-file threshold — or once the running total would exceed the package
 * cap — are skipped with an explanatory note in evidence/index.csv.
 */
import JSZip from "jszip";
import { PassThrough, Readable } from "node:stream";
import { serializeCsv } from "../questionnaires/csv.js";

export const AUDIT_PACKAGE_FORMAT_VERSION = 1;

/** Mirrors the 50 MB per-file upload cap used by the evidence module. */
export const MAX_EVIDENCE_FILE_BYTES = 50 * 1024 * 1024;
/** Sane ceiling for the whole package — further files are skipped with a note. */
export const MAX_PACKAGE_TOTAL_BYTES = 500 * 1024 * 1024;

// ─── Input shapes (plain data, no Prisma types) ───────────────────────

export interface PackageOwner {
  name: string | null;
  email: string | null;
}

export interface PackageControl {
  id: string;
  title: string;
  status: string;
  category: string | null;
  implementationDetails?: string | null;
  owner?: PackageOwner | null;
}

export interface PackageAssignment {
  requirement: {
    id: string;
    identifier: string;
    title: string;
    category: string | null;
    sortOrder: number;
  };
  control: PackageControl;
}

export interface PackageEvidence {
  id: string;
  title: string;
  type: string;
  status: string;
  sourceType: string | null;
  createdAt: Date;
  controlId: string;
  fileKey: string | null;
  fileName: string | null;
  fileSize: number | null;
}

export interface PackageMeta {
  tenantName: string;
  framework: { name: string; version: string; frameworkType: string };
  instance: {
    id: string;
    status: string;
    isEnabled: boolean;
    targetDate: Date | null;
    certifiedAt: Date | null;
    targetMaturityLevel: string | null;
  };
  /** Total requirements in the framework catalog (mapped or not). */
  totalRequirements: number;
  exportedBy?: { id: string; name: string | null; email: string | null } | null;
  generatedAt?: Date;
}

/** Minimal storage surface — satisfied by `@trustalo/storage` providers. */
export interface PackageStorage {
  exists(key: string): Promise<boolean>;
  download(key: string): Promise<{ data: ReadableStream }>;
}

export interface PackageLimits {
  maxFileBytes: number;
  maxTotalBytes: number;
}

// ─── Source classification ────────────────────────────────────────────

export type EvidenceSource = "manual" | "hr_advisory" | "integration";

/**
 * Buckets an evidence row for the auditor-facing "Source" column.
 * `sourceType` is the free-form routing key set by the writer: `"manual"`
 * (or null) for hand-uploaded items, `"people.*"` for HR-advisory emitters
 * and integration manifest keys (`"aws.iam"`, `"device.disk_encryption"`,
 * …) for automated collection.
 */
export function classifyEvidenceSource(
  evidence: Pick<PackageEvidence, "sourceType">,
): EvidenceSource {
  const sourceType = evidence.sourceType;
  if (!sourceType || sourceType === "manual") return "manual";
  if (sourceType.startsWith("people.")) return "hr_advisory";
  return "integration";
}

// ─── Evidence file planning ───────────────────────────────────────────

export type EvidenceFileSkipReason =
  | "no_file"
  | "not_approved"
  | "file_too_large"
  | "package_size_limit"
  | "missing_in_storage";

export interface PlannedEvidenceFile {
  evidence: PackageEvidence;
  /** Path inside the ZIP; null when the file is not included. */
  zipPath: string | null;
  skipReason: EvidenceFileSkipReason | null;
}

const SKIP_NOTES: Record<EvidenceFileSkipReason, string> = {
  no_file: "",
  not_approved: "file not included: evidence is not approved",
  file_too_large: "file not included: exceeds the per-file size limit",
  package_size_limit: "file not included: package size limit reached",
  missing_in_storage: "file not included: file missing in storage",
};

function sanitizeZipFileName(name: string): string {
  const cleaned = name
    // eslint-disable-next-line no-control-regex
    .replace(/[\\/:*?"<>|\u0000-\u001f]+/g, "_")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
  return cleaned || "file";
}

/**
 * Decides which evidence files go into the ZIP. Only APPROVED evidence
 * with a stored file is bundled; everything else stays metadata-only in
 * evidence/index.csv with a note explaining why.
 */
export function planEvidenceFiles(
  evidence: PackageEvidence[],
  limits: PackageLimits = {
    maxFileBytes: MAX_EVIDENCE_FILE_BYTES,
    maxTotalBytes: MAX_PACKAGE_TOTAL_BYTES,
  },
): PlannedEvidenceFile[] {
  let totalBytes = 0;

  return evidence.map((item) => {
    if (!item.fileKey) {
      return { evidence: item, zipPath: null, skipReason: "no_file" as const };
    }
    if (item.status !== "approved") {
      return { evidence: item, zipPath: null, skipReason: "not_approved" as const };
    }
    const size = item.fileSize ?? 0;
    if (size > limits.maxFileBytes) {
      return { evidence: item, zipPath: null, skipReason: "file_too_large" as const };
    }
    if (totalBytes + size > limits.maxTotalBytes) {
      return { evidence: item, zipPath: null, skipReason: "package_size_limit" as const };
    }
    totalBytes += size;
    // The evidence id prefix guarantees uniqueness inside the ZIP even
    // when two evidence rows share the same original file name.
    const zipPath = `evidence/files/${item.id}_${sanitizeZipFileName(item.fileName ?? "file")}`;
    return { evidence: item, zipPath, skipReason: null };
  });
}

/**
 * Downgrades planned files whose object is gone from storage to a skip
 * with a note, instead of letting the ZIP stream abort mid-download.
 */
async function markMissingFiles(
  planned: PlannedEvidenceFile[],
  storage: PackageStorage,
  concurrency = 8,
): Promise<void> {
  const candidates = planned.filter((p) => p.zipPath !== null);
  for (let i = 0; i < candidates.length; i += concurrency) {
    const batch = candidates.slice(i, i + concurrency);
    await Promise.all(
      batch.map(async (p) => {
        const present = await storage.exists(p.evidence.fileKey as string);
        if (!present) {
          p.zipPath = null;
          p.skipReason = "missing_in_storage";
        }
      }),
    );
  }
}

// ─── CSV builders ─────────────────────────────────────────────────────

const CONTROLS_CSV_HEADERS = [
  "Requirement ID",
  "Requirement Title",
  "Category",
  "Control ID",
  "Control Title",
  "Control Status",
  "Owner",
  "Evidence IDs",
];

export function buildControlsCsv(
  assignments: PackageAssignment[],
  evidence: PackageEvidence[],
): string {
  const evidenceIdsByControl = new Map<string, string[]>();
  for (const item of evidence) {
    const ids = evidenceIdsByControl.get(item.controlId) ?? [];
    ids.push(item.id);
    evidenceIdsByControl.set(item.controlId, ids);
  }

  const rows = sortedByRequirement(assignments).map(({ requirement, control }) => ({
    "Requirement ID": requirement.identifier,
    "Requirement Title": requirement.title,
    Category: requirement.category ?? control.category ?? "",
    "Control ID": control.id,
    "Control Title": control.title,
    "Control Status": control.status,
    Owner: control.owner ? (control.owner.name ?? control.owner.email ?? "") : "",
    "Evidence IDs": (evidenceIdsByControl.get(control.id) ?? []).join("; "),
  }));

  return serializeCsv(CONTROLS_CSV_HEADERS, rows);
}

const SOA_CSV_HEADERS = [
  "Requirement ID",
  "Requirement Title",
  "Category",
  "Applicable",
  "Justification",
  "Implementation Status",
  "Control Title",
];

/**
 * Statement of Applicability rows for the instance. Applicability is
 * derived from the mapped control: a control marked `not_applicable`
 * excludes the requirement from scope, and the control's implementation
 * details double as the inclusion/exclusion justification.
 */
export function buildSoaCsv(assignments: PackageAssignment[]): string {
  const rows = sortedByRequirement(assignments).map(({ requirement, control }) => ({
    "Requirement ID": requirement.identifier,
    "Requirement Title": requirement.title,
    Category: requirement.category ?? control.category ?? "",
    Applicable: control.status === "not_applicable" ? "No" : "Yes",
    Justification: control.implementationDetails ?? "",
    "Implementation Status": control.status,
    "Control Title": control.title,
  }));

  return serializeCsv(SOA_CSV_HEADERS, rows);
}

const EVIDENCE_INDEX_HEADERS = [
  "Evidence ID",
  "Title",
  "Source",
  "Source Type",
  "Evidence Type",
  "Status",
  "Created At",
  "Control ID",
  "Requirement IDs",
  "Original File Name",
  "File In Zip",
  "Note",
];

export function buildEvidenceIndexCsv(
  planned: PlannedEvidenceFile[],
  assignments: PackageAssignment[],
): string {
  const requirementIdsByControl = new Map<string, string[]>();
  for (const { requirement, control } of assignments) {
    const ids = requirementIdsByControl.get(control.id) ?? [];
    if (!ids.includes(requirement.identifier)) ids.push(requirement.identifier);
    requirementIdsByControl.set(control.id, ids);
  }

  const rows = planned.map(({ evidence, zipPath, skipReason }) => ({
    "Evidence ID": evidence.id,
    Title: evidence.title,
    Source: classifyEvidenceSource(evidence),
    "Source Type": evidence.sourceType ?? "manual",
    "Evidence Type": evidence.type,
    Status: evidence.status,
    "Created At": evidence.createdAt.toISOString(),
    "Control ID": evidence.controlId,
    "Requirement IDs": (requirementIdsByControl.get(evidence.controlId) ?? []).join("; "),
    "Original File Name": evidence.fileName ?? "",
    "File In Zip": zipPath ?? "",
    Note: skipReason ? SKIP_NOTES[skipReason] : "",
  }));

  return serializeCsv(EVIDENCE_INDEX_HEADERS, rows);
}

function sortedByRequirement(assignments: PackageAssignment[]): PackageAssignment[] {
  return [...assignments].sort(
    (a, b) =>
      a.requirement.sortOrder - b.requirement.sortOrder ||
      a.requirement.identifier.localeCompare(b.requirement.identifier),
  );
}

// ─── Manifest ─────────────────────────────────────────────────────────

export interface AuditPackageManifest {
  packageFormatVersion: number;
  generatedAt: string;
  exportedBy: { id: string; name: string | null; email: string | null } | null;
  organization: { name: string };
  framework: { name: string; version: string; type: string };
  instance: {
    id: string;
    status: string;
    isEnabled: boolean;
    targetDate: string | null;
    certifiedAt: string | null;
    targetMaturityLevel: string | null;
  };
  controls: { total: number; byStatus: Record<string, number> };
  requirements: { total: number; mapped: number };
  evidence: {
    total: number;
    byStatus: Record<string, number>;
    filesIncluded: number;
    filesSkipped: number;
  };
  contents: string[];
}

export function buildManifest(
  meta: PackageMeta,
  assignments: PackageAssignment[],
  planned: PlannedEvidenceFile[],
): AuditPackageManifest {
  const controlStatusById = new Map<string, string>();
  const mappedRequirementIds = new Set<string>();
  for (const { requirement, control } of assignments) {
    controlStatusById.set(control.id, control.status);
    mappedRequirementIds.add(requirement.id);
  }

  const controlsByStatus: Record<string, number> = {};
  for (const status of controlStatusById.values()) {
    controlsByStatus[status] = (controlsByStatus[status] ?? 0) + 1;
  }

  const evidenceByStatus: Record<string, number> = {};
  let filesIncluded = 0;
  let filesSkipped = 0;
  for (const { evidence, zipPath, skipReason } of planned) {
    evidenceByStatus[evidence.status] = (evidenceByStatus[evidence.status] ?? 0) + 1;
    if (zipPath) filesIncluded++;
    else if (skipReason && skipReason !== "no_file") filesSkipped++;
  }

  return {
    packageFormatVersion: AUDIT_PACKAGE_FORMAT_VERSION,
    generatedAt: (meta.generatedAt ?? new Date()).toISOString(),
    exportedBy: meta.exportedBy ?? null,
    organization: { name: meta.tenantName },
    framework: {
      name: meta.framework.name,
      version: meta.framework.version,
      type: meta.framework.frameworkType,
    },
    instance: {
      id: meta.instance.id,
      status: meta.instance.status,
      isEnabled: meta.instance.isEnabled,
      targetDate: meta.instance.targetDate?.toISOString() ?? null,
      certifiedAt: meta.instance.certifiedAt?.toISOString() ?? null,
      targetMaturityLevel: meta.instance.targetMaturityLevel,
    },
    controls: { total: controlStatusById.size, byStatus: controlsByStatus },
    requirements: { total: meta.totalRequirements, mapped: mappedRequirementIds.size },
    evidence: {
      total: planned.length,
      byStatus: evidenceByStatus,
      filesIncluded,
      filesSkipped,
    },
    contents: ["manifest.json", "controls.csv", "soa.csv", "evidence/index.csv", "evidence/files/"],
  };
}

// ─── Lazy download stream ─────────────────────────────────────────────

/**
 * A Node Readable that starts the (potentially expensive) download only
 * when something actually reads from it. JSZip pauses every input stream
 * at `file()` time and resumes them one at a time during generation, so
 * this keeps S3 GETs sequential and just-in-time.
 */
function lazyDownloadStream(start: () => Promise<ReadableStream>): Readable {
  const pass = new PassThrough();
  let started = false;
  const originalRead = pass._read.bind(pass);
  pass._read = function (size: number) {
    if (!started) {
      started = true;
      start()
        .then((webStream) => {
          Readable.fromWeb(webStream as import("node:stream/web").ReadableStream).pipe(pass);
        })
        .catch((err: unknown) => {
          pass.destroy(err instanceof Error ? err : new Error(String(err)));
        });
    }
    originalRead(size);
  };
  return pass;
}

// ─── Assembly ─────────────────────────────────────────────────────────

export interface AssembledAuditPackage {
  zip: JSZip;
  manifest: AuditPackageManifest;
  planned: PlannedEvidenceFile[];
}

export async function assembleAuditPackage(input: {
  meta: PackageMeta;
  assignments: PackageAssignment[];
  evidence: PackageEvidence[];
  storage: PackageStorage;
  limits?: PackageLimits;
}): Promise<AssembledAuditPackage> {
  const { meta, assignments, evidence, storage, limits } = input;

  const planned = planEvidenceFiles(evidence, limits);
  await markMissingFiles(planned, storage);

  const manifest = buildManifest(meta, assignments, planned);

  const zip = new JSZip();
  zip.file("manifest.json", JSON.stringify(manifest, null, 2));
  zip.file("controls.csv", buildControlsCsv(assignments, evidence));
  zip.file("soa.csv", buildSoaCsv(assignments));
  zip.file("evidence/index.csv", buildEvidenceIndexCsv(planned, assignments));

  for (const p of planned) {
    if (!p.zipPath) continue;
    const fileKey = p.evidence.fileKey as string;
    zip.file(
      p.zipPath,
      lazyDownloadStream(async () => (await storage.download(fileKey)).data),
    );
  }

  return { zip, manifest, planned };
}
