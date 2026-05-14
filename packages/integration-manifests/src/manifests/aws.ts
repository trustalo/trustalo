import type { Manifest } from "../types.js";

/**
 * AWS connector — root account hardening + foundational IAM checks.
 * Mappings reference SOC 2, ISO 27001, and ACSC Essential Eight from
 * publicly available framework documentation only (per constraint C1).
 */
export const awsManifest: Manifest = {
  connector: "aws",
  displayName: "Amazon Web Services",
  description:
    "Continuously verifies AWS account-level controls (root MFA, IAM password policy, CloudTrail, S3 public access).",
  iconKey: "aws",
  category: "cloud",
  authType: "aws_iam",
  configFields: [
    {
      key: "roleArn",
      label: "Cross-account role ARN",
      type: "string",
      required: true,
      helpText:
        "Trustalo assumes this role with a read-only policy. We never store long-lived keys.",
    },
    {
      key: "externalId",
      label: "External ID",
      type: "secret",
      required: true,
    },
    {
      key: "regions",
      label: "Regions to inspect (comma-separated)",
      type: "string",
      required: false,
      defaultValue: "us-east-1",
    },
  ],
  checks: [
    {
      key: "aws.iam.root_mfa_enabled",
      title: "Root account MFA is enabled",
      description: "AWS account root user has a multi-factor device attached.",
      severity: "critical",
      runner: "aws_sdk",
      params: { service: "iam", call: "GetAccountSummary" },
      controlMappings: [
        { framework: "soc2", requirement: "CC6.1" },
        { framework: "iso27001", requirement: "A.5.17" },
        { framework: "essential8", requirement: "ML2-MFA" },
      ],
    },
    {
      key: "aws.iam.password_policy_strong",
      title: "IAM password policy meets minimum strength",
      description:
        "Min length ≥ 14, requires upper/lower/number/symbol, max age ≤ 90 days, reuse prevented.",
      severity: "high",
      runner: "aws_sdk",
      params: { service: "iam", call: "GetAccountPasswordPolicy" },
      controlMappings: [
        { framework: "soc2", requirement: "CC6.1" },
        { framework: "iso27001", requirement: "A.5.17" },
      ],
    },
    {
      key: "aws.cloudtrail.multi_region_enabled",
      title: "CloudTrail is enabled in all regions",
      description: "At least one multi-region CloudTrail trail is logging.",
      severity: "high",
      runner: "aws_sdk",
      params: { service: "cloudtrail", call: "DescribeTrails" },
      controlMappings: [
        { framework: "soc2", requirement: "CC7.2" },
        { framework: "iso27001", requirement: "A.8.15" },
      ],
    },
    {
      key: "aws.s3.public_access_block",
      title: "S3 account-level public access block is on",
      description: "All four BlockPublicAccess flags are true at the account level.",
      severity: "high",
      runner: "aws_sdk",
      params: { service: "s3control", call: "GetPublicAccessBlock" },
      controlMappings: [
        { framework: "soc2", requirement: "CC6.7" },
        { framework: "iso27001", requirement: "A.5.10" },
      ],
    },
  ],
};
