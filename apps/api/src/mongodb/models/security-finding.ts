import { Schema, model, type Document } from "mongoose";

export interface ISecurityFinding extends Document {
  tenantId: string;
  source: string;
  sourceId?: string;
  title: string;
  description?: string;
  severity: string;
  status: string;
  resourceType?: string;
  resourceId?: string;
  rawData?: unknown;
  remediationGuidance?: string;
  resolvedAt?: Date;
  resolvedById?: string;
  createdAt: Date;
  updatedAt: Date;
}

const securityFindingSchema = new Schema<ISecurityFinding>(
  {
    tenantId: { type: String, required: true, index: true },
    source: {
      type: String,
      required: true,
      enum: [
        "aws_security_hub",
        "github_code_scanning",
        "github_dependabot",
        "github_secret_scanning",
        "bitbucket_security",
        "manual",
      ],
    },
    sourceId: { type: String },
    title: { type: String, required: true },
    description: { type: String },
    severity: {
      type: String,
      required: true,
      enum: ["critical", "high", "medium", "low", "informational"],
    },
    status: {
      type: String,
      required: true,
      enum: ["open", "investigating", "resolved", "suppressed", "false_positive"],
      default: "open",
    },
    resourceType: { type: String },
    resourceId: { type: String },
    rawData: { type: Schema.Types.Mixed },
    remediationGuidance: { type: String },
    resolvedAt: { type: Date },
    resolvedById: { type: String },
  },
  { timestamps: true },
);

securityFindingSchema.index({ tenantId: 1, source: 1, severity: 1 });

export const SecurityFinding = model<ISecurityFinding>("SecurityFinding", securityFindingSchema);
