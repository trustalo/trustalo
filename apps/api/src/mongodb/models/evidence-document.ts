import { Schema, model, type Document } from "mongoose";

export interface IEvidenceDocument extends Document {
  tenantId: string;
  sourceType: string;
  sourceId: string;
  title: string;
  description?: string;
  fileUrl?: string;
  rawData?: unknown;
  collectedAt?: Date;
  expiresAt?: Date;
  status: string;
  controlId?: string;
  taskId?: string;
  submittedBy?: string;
  approvedBy?: string;
  approvedAt?: Date;
  metadata?: unknown;
  createdAt: Date;
  updatedAt: Date;
}

const evidenceDocumentSchema = new Schema<IEvidenceDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    sourceType: {
      type: String,
      required: true,
      enum: ["aws", "office365", "github", "bitbucket", "manual"],
    },
    sourceId: { type: String },
    title: { type: String, required: true },
    description: { type: String },
    fileUrl: { type: String },
    rawData: { type: Schema.Types.Mixed },
    collectedAt: { type: Date },
    expiresAt: { type: Date },
    status: {
      type: String,
      required: true,
      enum: ["draft", "pending_review", "approved", "rejected", "expired"],
      default: "draft",
    },
    controlId: { type: String },
    taskId: { type: String },
    submittedBy: { type: String },
    approvedBy: { type: String },
    approvedAt: { type: Date },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

evidenceDocumentSchema.index({ tenantId: 1, sourceType: 1 });

export const EvidenceDocument = model<IEvidenceDocument>(
  "EvidenceDocument",
  evidenceDocumentSchema,
);
