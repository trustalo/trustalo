import { Schema, model, type Document } from "mongoose";

export interface IComplianceSnapshot extends Document {
  tenantId: string;
  frameworkInstanceId: string;
  frameworkType: string;
  snapshotDate: Date;
  overallScore: number;
  controlStats: {
    total: number;
    implemented: number;
    partiallyImplemented: number;
    notImplemented: number;
    notApplicable: number;
  };
  policyStats: {
    total: number;
    published: number;
    draft: number;
    archived: number;
  };
  riskStats: {
    total: number;
    byLevel: Record<string, number>;
  };
  evidenceStats: {
    total: number;
    approved: number;
    pending: number;
    expired: number;
  };
  createdAt: Date;
}

const complianceSnapshotSchema = new Schema<IComplianceSnapshot>(
  {
    tenantId: { type: String, required: true, index: true },
    frameworkInstanceId: { type: String, required: true },
    frameworkType: { type: String, required: true },
    snapshotDate: { type: Date, required: true },
    overallScore: { type: Number, required: true },
    controlStats: {
      total: { type: Number, default: 0 },
      implemented: { type: Number, default: 0 },
      partiallyImplemented: { type: Number, default: 0 },
      notImplemented: { type: Number, default: 0 },
      notApplicable: { type: Number, default: 0 },
    },
    policyStats: {
      total: { type: Number, default: 0 },
      published: { type: Number, default: 0 },
      draft: { type: Number, default: 0 },
      archived: { type: Number, default: 0 },
    },
    riskStats: {
      total: { type: Number, default: 0 },
      byLevel: { type: Schema.Types.Mixed, default: {} },
    },
    evidenceStats: {
      total: { type: Number, default: 0 },
      approved: { type: Number, default: 0 },
      pending: { type: Number, default: 0 },
      expired: { type: Number, default: 0 },
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

complianceSnapshotSchema.index({ tenantId: 1, frameworkType: 1, snapshotDate: -1 });

export const ComplianceSnapshot = model<IComplianceSnapshot>(
  "ComplianceSnapshot",
  complianceSnapshotSchema,
);
