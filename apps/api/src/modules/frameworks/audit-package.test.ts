import { describe, expect, test } from "bun:test";
import JSZip from "jszip";
import {
  assembleAuditPackage,
  buildControlsCsv,
  buildEvidenceIndexCsv,
  buildManifest,
  buildSoaCsv,
  classifyEvidenceSource,
  planEvidenceFiles,
  AUDIT_PACKAGE_FORMAT_VERSION,
  type PackageAssignment,
  type PackageEvidence,
  type PackageMeta,
  type PackageStorage,
} from "./audit-package.js";
import { parseCsv } from "../questionnaires/csv.js";

// ─── Fixtures ─────────────────────────────────────────────────────────

function makeAssignment(overrides: {
  reqId?: string;
  identifier: string;
  title?: string;
  sortOrder?: number;
  controlId: string;
  controlTitle?: string;
  status?: string;
  category?: string | null;
  implementationDetails?: string | null;
  owner?: { name: string | null; email: string | null } | null;
}): PackageAssignment {
  return {
    requirement: {
      id: overrides.reqId ?? `req-${overrides.identifier}`,
      identifier: overrides.identifier,
      title: overrides.title ?? `Requirement ${overrides.identifier}`,
      category: overrides.category ?? "Organizational",
      sortOrder: overrides.sortOrder ?? 0,
    },
    control: {
      id: overrides.controlId,
      title: overrides.controlTitle ?? `Control for ${overrides.identifier}`,
      status: overrides.status ?? "implemented",
      category: overrides.category ?? "Organizational",
      implementationDetails: overrides.implementationDetails ?? null,
      owner: overrides.owner ?? null,
    },
  };
}

function makeEvidence(overrides: Partial<PackageEvidence> & { id: string }): PackageEvidence {
  return {
    title: `Evidence ${overrides.id}`,
    type: "document",
    status: "approved",
    sourceType: "manual",
    createdAt: new Date("2026-06-01T00:00:00Z"),
    controlId: "ctrl-1",
    fileKey: null,
    fileName: null,
    fileSize: null,
    ...overrides,
  };
}

const META: PackageMeta = {
  tenantName: "Acme Corp",
  framework: { name: "ISO/IEC 27001", version: "2022", frameworkType: "iso27001" },
  instance: {
    id: "inst-1",
    status: "in_progress",
    isEnabled: true,
    targetDate: new Date("2026-12-31T00:00:00Z"),
    certifiedAt: null,
    targetMaturityLevel: null,
  },
  totalRequirements: 93,
  exportedBy: { id: "user-1", name: "Jane Auditor", email: "jane@acme.test" },
  generatedAt: new Date("2026-07-02T10:00:00Z"),
};

/** In-memory storage double implementing the `PackageStorage` surface. */
function memoryStorage(files: Record<string, string>): PackageStorage {
  return {
    async exists(key) {
      return key in files;
    },
    async download(key) {
      const body = files[key];
      if (body === undefined) throw new Error(`NoSuchKey: ${key}`);
      return { data: new Response(body).body as ReadableStream };
    },
  };
}

function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  // JSZip's generated stream implements the classic evented Readable
  // API but not Symbol.asyncIterator, so collect via events.
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on("data", (chunk: Uint8Array) => chunks.push(Buffer.from(chunk)));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
}

// ─── classifyEvidenceSource ───────────────────────────────────────────

describe("classifyEvidenceSource", () => {
  test("null and 'manual' bucket as manual", () => {
    expect(classifyEvidenceSource({ sourceType: null })).toBe("manual");
    expect(classifyEvidenceSource({ sourceType: "manual" })).toBe("manual");
  });

  test("people.* emitters bucket as hr_advisory", () => {
    expect(classifyEvidenceSource({ sourceType: "people.background_check" })).toBe("hr_advisory");
    expect(classifyEvidenceSource({ sourceType: "people.offboarding" })).toBe("hr_advisory");
  });

  test("integration manifest keys bucket as integration", () => {
    expect(classifyEvidenceSource({ sourceType: "aws.iam" })).toBe("integration");
    expect(classifyEvidenceSource({ sourceType: "device.disk_encryption" })).toBe("integration");
  });
});

// ─── planEvidenceFiles ────────────────────────────────────────────────

describe("planEvidenceFiles", () => {
  test("includes only approved evidence with files", () => {
    const planned = planEvidenceFiles([
      makeEvidence({ id: "e1", fileKey: "k1", fileName: "policy.pdf", fileSize: 10 }),
      makeEvidence({ id: "e2" }), // approved, no file
      makeEvidence({ id: "e3", status: "pending_review", fileKey: "k3", fileSize: 10 }),
    ]);

    expect(planned[0]!.zipPath).toBe("evidence/files/e1_policy.pdf");
    expect(planned[0]!.skipReason).toBeNull();
    expect(planned[1]!.zipPath).toBeNull();
    expect(planned[1]!.skipReason).toBe("no_file");
    expect(planned[2]!.zipPath).toBeNull();
    expect(planned[2]!.skipReason).toBe("not_approved");
  });

  test("skips files above the per-file threshold", () => {
    const planned = planEvidenceFiles([makeEvidence({ id: "e1", fileKey: "k1", fileSize: 101 })], {
      maxFileBytes: 100,
      maxTotalBytes: 1000,
    });
    expect(planned[0]!.skipReason).toBe("file_too_large");
  });

  test("stops including files once the package cap is reached", () => {
    const planned = planEvidenceFiles(
      [
        makeEvidence({ id: "e1", fileKey: "k1", fileSize: 60 }),
        makeEvidence({ id: "e2", fileKey: "k2", fileSize: 60 }),
        makeEvidence({ id: "e3", fileKey: "k3", fileSize: 30 }),
      ],
      { maxFileBytes: 100, maxTotalBytes: 100 },
    );
    expect(planned[0]!.skipReason).toBeNull();
    expect(planned[1]!.skipReason).toBe("package_size_limit");
    // A later, smaller file may still fit under the cap.
    expect(planned[2]!.skipReason).toBeNull();
  });

  test("sanitizes hostile file names and keeps zip paths unique per evidence id", () => {
    const planned = planEvidenceFiles([
      makeEvidence({ id: "e1", fileKey: "k1", fileName: "../../etc/passwd", fileSize: 1 }),
      makeEvidence({ id: "e2", fileKey: "k2", fileName: "../../etc/passwd", fileSize: 1 }),
    ]);
    expect(planned[0]!.zipPath).toBe("evidence/files/e1_.._.._etc_passwd");
    expect(planned[1]!.zipPath).toBe("evidence/files/e2_.._.._etc_passwd");
    expect(planned[0]!.zipPath).not.toBe(planned[1]!.zipPath);
  });
});

// ─── CSV builders ─────────────────────────────────────────────────────

describe("buildControlsCsv", () => {
  test("emits one row per requirement with linked evidence ids", () => {
    const assignments = [
      makeAssignment({
        identifier: "A.5.2",
        sortOrder: 2,
        controlId: "ctrl-2",
        status: "not_implemented",
      }),
      makeAssignment({
        identifier: "A.5.1",
        sortOrder: 1,
        controlId: "ctrl-1",
        owner: { name: "Sam Owner", email: "sam@acme.test" },
      }),
    ];
    const evidence = [
      makeEvidence({ id: "e1", controlId: "ctrl-1" }),
      makeEvidence({ id: "e2", controlId: "ctrl-1" }),
    ];

    const parsed = parseCsv(buildControlsCsv(assignments, evidence));
    expect(parsed.headers).toEqual([
      "Requirement ID",
      "Requirement Title",
      "Category",
      "Control ID",
      "Control Title",
      "Control Status",
      "Owner",
      "Evidence IDs",
    ]);
    // Sorted by requirement sortOrder.
    expect(parsed.rows[0]!.values["Requirement ID"]).toBe("A.5.1");
    expect(parsed.rows[0]!.values["Owner"]).toBe("Sam Owner");
    expect(parsed.rows[0]!.values["Evidence IDs"]).toBe("e1; e2");
    expect(parsed.rows[1]!.values["Requirement ID"]).toBe("A.5.2");
    expect(parsed.rows[1]!.values["Control Status"]).toBe("not_implemented");
    expect(parsed.rows[1]!.values["Evidence IDs"]).toBe("");
  });
});

describe("buildSoaCsv", () => {
  test("derives applicability from the control status", () => {
    const assignments = [
      makeAssignment({
        identifier: "A.5.1",
        sortOrder: 1,
        controlId: "ctrl-1",
        implementationDetails: "Covered by the ISMS policy suite",
      }),
      makeAssignment({
        identifier: "A.7.4",
        sortOrder: 2,
        controlId: "ctrl-2",
        status: "not_applicable",
        implementationDetails: "No physical premises",
      }),
    ];

    const parsed = parseCsv(buildSoaCsv(assignments));
    expect(parsed.rows[0]!.values["Applicable"]).toBe("Yes");
    expect(parsed.rows[0]!.values["Justification"]).toBe("Covered by the ISMS policy suite");
    expect(parsed.rows[1]!.values["Applicable"]).toBe("No");
    expect(parsed.rows[1]!.values["Justification"]).toBe("No physical premises");
    expect(parsed.rows[1]!.values["Implementation Status"]).toBe("not_applicable");
  });
});

describe("buildEvidenceIndexCsv", () => {
  test("lists every evidence row with source, linked requirements and zip path", () => {
    const assignments = [
      makeAssignment({ identifier: "A.5.1", sortOrder: 1, controlId: "ctrl-1" }),
      makeAssignment({ identifier: "A.8.9", sortOrder: 2, controlId: "ctrl-1" }),
    ];
    const planned = planEvidenceFiles([
      makeEvidence({
        id: "e1",
        controlId: "ctrl-1",
        sourceType: "people.training",
        fileKey: "k1",
        fileName: "report.pdf",
        fileSize: 5,
      }),
      makeEvidence({ id: "e2", controlId: "ctrl-1", status: "pending_review", fileKey: "k2" }),
    ]);

    const parsed = parseCsv(buildEvidenceIndexCsv(planned, assignments));
    expect(parsed.rows).toHaveLength(2);
    expect(parsed.rows[0]!.values["Source"]).toBe("hr_advisory");
    expect(parsed.rows[0]!.values["Requirement IDs"]).toBe("A.5.1; A.8.9");
    expect(parsed.rows[0]!.values["File In Zip"]).toBe("evidence/files/e1_report.pdf");
    expect(parsed.rows[0]!.values["Note"]).toBe("");
    expect(parsed.rows[1]!.values["Status"]).toBe("pending_review");
    expect(parsed.rows[1]!.values["File In Zip"]).toBe("");
    expect(parsed.rows[1]!.values["Note"]).toBe("file not included: evidence is not approved");
  });
});

// ─── buildManifest ────────────────────────────────────────────────────

describe("buildManifest", () => {
  test("counts distinct controls by status and evidence by status", () => {
    const assignments = [
      makeAssignment({ identifier: "A.5.1", controlId: "ctrl-1", status: "implemented" }),
      // Same control mapped to a second requirement — counted once.
      makeAssignment({ identifier: "A.5.2", controlId: "ctrl-1", status: "implemented" }),
      makeAssignment({ identifier: "A.5.3", controlId: "ctrl-2", status: "not_implemented" }),
    ];
    const planned = planEvidenceFiles([
      makeEvidence({ id: "e1", fileKey: "k1", fileSize: 1 }),
      makeEvidence({ id: "e2", status: "pending_review" }),
      makeEvidence({ id: "e3", status: "approved", fileKey: "k3", fileSize: 10 ** 9 }),
    ]);

    const manifest = buildManifest(META, assignments, planned);

    expect(manifest.packageFormatVersion).toBe(AUDIT_PACKAGE_FORMAT_VERSION);
    expect(manifest.generatedAt).toBe("2026-07-02T10:00:00.000Z");
    expect(manifest.organization.name).toBe("Acme Corp");
    expect(manifest.framework).toEqual({
      name: "ISO/IEC 27001",
      version: "2022",
      type: "iso27001",
    });
    expect(manifest.controls).toEqual({
      total: 2,
      byStatus: { implemented: 1, not_implemented: 1 },
    });
    expect(manifest.requirements).toEqual({ total: 93, mapped: 3 });
    expect(manifest.evidence.total).toBe(3);
    expect(manifest.evidence.byStatus).toEqual({ approved: 2, pending_review: 1 });
    expect(manifest.evidence.filesIncluded).toBe(1);
    // e3 was skipped for size; e2 has no file at all so it is not a "skip".
    expect(manifest.evidence.filesSkipped).toBe(1);
  });
});

// ─── assembleAuditPackage (end to end, in memory) ─────────────────────

describe("assembleAuditPackage", () => {
  test("produces a readable ZIP with manifest, CSVs and approved files", async () => {
    const assignments = [
      makeAssignment({ identifier: "A.5.1", sortOrder: 1, controlId: "ctrl-1" }),
    ];
    const evidence = [
      makeEvidence({
        id: "e1",
        controlId: "ctrl-1",
        fileKey: "evidence/t1/e1/file.pdf",
        fileName: "file.pdf",
        fileSize: 11,
      }),
      makeEvidence({ id: "e2", controlId: "ctrl-1", fileKey: "gone.pdf", fileSize: 3 }),
    ];
    const storage = memoryStorage({ "evidence/t1/e1/file.pdf": "PDF-CONTENT" });

    const { zip, manifest, planned } = await assembleAuditPackage({
      meta: META,
      assignments,
      evidence,
      storage,
    });

    // Missing object downgraded to a note instead of aborting the stream.
    expect(planned[1]!.skipReason).toBe("missing_in_storage");
    expect(manifest.evidence.filesIncluded).toBe(1);
    expect(manifest.evidence.filesSkipped).toBe(1);

    // Generate through the same streaming path the route uses.
    const buffer = await streamToBuffer(
      zip.generateNodeStream({ type: "nodebuffer", streamFiles: true }),
    );
    const readBack = await JSZip.loadAsync(buffer);

    expect(Object.keys(readBack.files).sort()).toEqual(
      [
        "controls.csv",
        "evidence/",
        "evidence/files/",
        "evidence/files/e1_file.pdf",
        "evidence/index.csv",
        "manifest.json",
        "soa.csv",
      ].sort(),
    );

    const roundTripped = JSON.parse(await readBack.file("manifest.json")!.async("string"));
    expect(roundTripped).toEqual(JSON.parse(JSON.stringify(manifest)));

    expect(await readBack.file("evidence/files/e1_file.pdf")!.async("string")).toBe("PDF-CONTENT");

    const index = parseCsv(await readBack.file("evidence/index.csv")!.async("string"));
    expect(index.rows[1]!.values["Note"]).toBe("file not included: file missing in storage");
  });

  test("propagates a download failure as a stream error", async () => {
    const storage: PackageStorage = {
      exists: async () => true,
      download: async () => {
        throw new Error("boom");
      },
    };
    const { zip } = await assembleAuditPackage({
      meta: META,
      assignments: [makeAssignment({ identifier: "A.5.1", controlId: "ctrl-1" })],
      evidence: [makeEvidence({ id: "e1", fileKey: "k1", fileSize: 1 })],
      storage,
    });

    await expect(
      streamToBuffer(zip.generateNodeStream({ type: "nodebuffer", streamFiles: true })),
    ).rejects.toThrow("boom");
  });
});
