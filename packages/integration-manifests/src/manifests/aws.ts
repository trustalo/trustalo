import type { Manifest } from "../types.js";

/**
 * AWS connector — root account hardening + foundational IAM checks.
 * Mappings reference SOC 2, ISO 27001, and ACSC Essential Eight from
 * publicly available framework documentation only (per constraint C1).
 */
export const awsManifest: Manifest = {
  connector: "aws",
  version: "1.0.0",
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
        { framework: "hipaa", requirement: "164.312(d)" },
        { framework: "pci_dss_4", requirement: "8.4.1" },
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
        { framework: "hipaa", requirement: "164.308(a)(5)(ii)(D)" },
        { framework: "pci_dss_4", requirement: "8.3.6" },
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
        { framework: "hipaa", requirement: "164.312(b)" },
        { framework: "hipaa", requirement: "164.308(a)(1)(ii)(D)" },
        { framework: "pci_dss_4", requirement: "10.2.1" },
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
        { framework: "pci_dss_4", requirement: "1.4.1" },
      ],
    },
  ],
  capabilities: [
    {
      key: "aws.iam.mfa_status",
      title: "IAM user MFA enrolment",
      description: "Per-user MFA enrolment across the account.",
      defaultSeverity: "high",
      controlMappings: [
        { framework: "soc2", requirement: "CC6.1" },
        { framework: "soc2", requirement: "CC6.3" },
        { framework: "iso27001", requirement: "A.9.4.2" },
        { framework: "hipaa", requirement: "164.312(d)" },
        { framework: "pci_dss_4", requirement: "8.4.1" },
      ],
    },
    {
      key: "aws.iam.password_policy",
      title: "IAM password policy",
      description: "Account-wide IAM password policy snapshot.",
      controlMappings: [
        { framework: "soc2", requirement: "CC6.1" },
        { framework: "iso27001", requirement: "A.9.4.3" },
        { framework: "hipaa", requirement: "164.308(a)(5)(ii)(D)" },
        { framework: "pci_dss_4", requirement: "8.3.6" },
      ],
    },
    {
      key: "aws.iam.roles",
      title: "IAM role inventory",
      description: "All IAM roles configured in the account.",
      controlMappings: [
        { framework: "soc2", requirement: "CC6.1" },
        { framework: "iso27001", requirement: "A.9.2.3" },
        { framework: "hipaa", requirement: "164.308(a)(4)(ii)(B)" },
        { framework: "hipaa", requirement: "164.308(a)(4)(ii)(C)" },
        { framework: "pci_dss_4", requirement: "7.2.1" },
        { framework: "pci_dss_4", requirement: "7.2.2" },
      ],
    },
    {
      key: "aws.cloudtrail.config",
      title: "CloudTrail configuration",
      description: "Trail inventory plus logging status per trail.",
      defaultSeverity: "high",
      controlMappings: [
        { framework: "soc2", requirement: "CC7.2" },
        { framework: "iso27001", requirement: "A.12.4.1" },
        { framework: "hipaa", requirement: "164.312(b)" },
        { framework: "hipaa", requirement: "164.308(a)(1)(ii)(D)" },
        { framework: "pci_dss_4", requirement: "10.2.1" },
      ],
    },
    {
      key: "aws.s3.security",
      title: "S3 bucket security posture",
      description: "Per-bucket encryption + public access block coverage.",
      defaultSeverity: "high",
      controlMappings: [
        { framework: "soc2", requirement: "CC6.1" },
        { framework: "soc2", requirement: "CC6.7" },
        { framework: "iso27001", requirement: "A.10.1.1" },
        { framework: "hipaa", requirement: "164.312(a)(2)(iv)" },
        { framework: "pci_dss_4", requirement: "3.5.1" },
        { framework: "pci_dss_4", requirement: "1.4.1" },
      ],
    },
    {
      key: "aws.ec2.security_groups",
      title: "EC2 security groups",
      description: "Security groups with their ingress rules.",
      defaultSeverity: "high",
      controlMappings: [
        { framework: "soc2", requirement: "CC6.1" },
        { framework: "soc2", requirement: "CC6.6" },
        { framework: "iso27001", requirement: "A.13.1.1" },
        { framework: "pci_dss_4", requirement: "1.3.1" },
        { framework: "pci_dss_4", requirement: "1.4.1" },
      ],
    },
    {
      key: "aws.ec2.flow_logs",
      title: "VPC flow logs",
      description: "VPC flow log configuration inventory.",
      defaultSeverity: "medium",
      controlMappings: [
        { framework: "soc2", requirement: "CC7.2" },
        { framework: "iso27001", requirement: "A.12.4.1" },
        { framework: "hipaa", requirement: "164.312(b)" },
        { framework: "hipaa", requirement: "164.308(a)(1)(ii)(D)" },
        { framework: "pci_dss_4", requirement: "10.2.1" },
      ],
    },
  ],
};
