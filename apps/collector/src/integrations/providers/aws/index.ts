import { STSClient, AssumeRoleCommand, GetCallerIdentityCommand } from "@aws-sdk/client-sts";
import {
  IAMClient,
  ListUsersCommand,
  ListMFADevicesCommand,
  ListRolesCommand,
  GetAccountPasswordPolicyCommand,
} from "@aws-sdk/client-iam";
import {
  CloudTrailClient,
  DescribeTrailsCommand,
  GetTrailStatusCommand,
} from "@aws-sdk/client-cloudtrail";
import {
  S3Client,
  ListBucketsCommand,
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand,
} from "@aws-sdk/client-s3";
import {
  EC2Client,
  DescribeSecurityGroupsCommand,
  DescribeFlowLogsCommand,
} from "@aws-sdk/client-ec2";
import type {
  IntegrationProvider,
  DecryptedCredentials,
  ProviderConnection,
  CollectOptions,
  EvidenceResult,
  ConnectionTestResult,
  PermissionRequirement,
  CredentialField,
} from "../../core/types.js";

interface AWSClients {
  region: string;
  credentials: { accessKeyId: string; secretAccessKey: string; sessionToken: string };
  accountId?: string;
}

export class AWSProvider implements IntegrationProvider {
  readonly id = "aws";
  readonly name = "Amazon Web Services";
  readonly description =
    "Collect evidence from AWS including IAM, CloudTrail, S3, VPC, and Security Hub";
  readonly version = "1.0.0";
  readonly category = "cloud" as const;
  readonly authType = "iam_role" as const;
  readonly capabilities = ["iam", "cloudtrail", "s3", "vpc", "security_groups"];
  readonly configSchema: CredentialField[] = [
    {
      key: "roleArn",
      label: "IAM Role ARN",
      type: "text",
      required: true,
      placeholder: "arn:aws:iam::123456789012:role/TrustraCollector",
      description: "ARN of the IAM role to assume",
    },
    {
      key: "externalId",
      label: "External ID",
      type: "text",
      required: true,
      description: "External ID for cross-account access",
    },
    {
      key: "region",
      label: "Region",
      type: "text",
      required: false,
      default: "us-east-1",
      placeholder: "us-east-1",
    },
  ];

  async connect(credentials: DecryptedCredentials): Promise<ProviderConnection> {
    const region = credentials["region"] ?? "us-east-1";
    const sts = new STSClient({ region });

    const assumed = await sts.send(
      new AssumeRoleCommand({
        RoleArn: credentials["roleArn"],
        ExternalId: credentials["externalId"],
        RoleSessionName: "trustalo-collector",
        DurationSeconds: 3600,
      }),
    );

    if (!assumed.Credentials) {
      throw new Error("STS AssumeRole did not return credentials");
    }

    const identity = await new STSClient({
      region,
      credentials: {
        accessKeyId: assumed.Credentials.AccessKeyId!,
        secretAccessKey: assumed.Credentials.SecretAccessKey!,
        sessionToken: assumed.Credentials.SessionToken!,
      },
    }).send(new GetCallerIdentityCommand({}));

    const clients: AWSClients = {
      region,
      credentials: {
        accessKeyId: assumed.Credentials.AccessKeyId!,
        secretAccessKey: assumed.Credentials.SecretAccessKey!,
        sessionToken: assumed.Credentials.SessionToken!,
      },
      accountId: identity.Account,
    };

    return { id: `aws-${Date.now()}`, integration: this.id, client: clients };
  }

  async collectEvidence(
    connection: ProviderConnection,
    options: CollectOptions,
  ): Promise<EvidenceResult[]> {
    const { credentials, region } = connection.client as AWSClients;
    const results: EvidenceResult[] = [];
    const now = new Date();

    const iam = new IAMClient({ region, credentials });
    const ct = new CloudTrailClient({ region, credentials });
    const s3 = new S3Client({ region, credentials });
    const ec2 = new EC2Client({ region, credentials });

    // --- IAM Users & MFA ---
    try {
      const usersResp = await iam.send(new ListUsersCommand({ MaxItems: 500 }));
      const users = usersResp.Users ?? [];
      let usersWithoutMfa = 0;

      for (const user of users) {
        const mfaResp = await iam.send(new ListMFADevicesCommand({ UserName: user.UserName }));
        if (!mfaResp.MFADevices?.length) usersWithoutMfa++;
      }

      results.push({
        title: "IAM User MFA Status",
        description: `${users.length} IAM users found, ${usersWithoutMfa} without MFA enabled`,
        sourceType: "aws.iam.mfa_status",
        sourceId: `aws-iam-mfa-${options.tenantId}`,
        rawData: {
          totalUsers: users.length,
          usersWithoutMfa,
          users: users.map((u) => ({
            userName: u.UserName,
            createDate: u.CreateDate,
            hasMfa: true,
          })),
        },
        severity: usersWithoutMfa > 0 ? "high" : "info",
        controlMapping: ["CC6.1", "CC6.3", "IA-2", "A.9.4.2"],
        collectedAt: now,
      });
    } catch (err) {
      console.error("[aws] failed to collect IAM MFA:", err);
    }

    // --- IAM Password Policy ---
    try {
      const policyResp = await iam.send(new GetAccountPasswordPolicyCommand({}));
      const policy = policyResp.PasswordPolicy;
      results.push({
        title: "IAM Password Policy",
        description: `Min length: ${policy?.MinimumPasswordLength}, require symbols: ${policy?.RequireSymbols}, max age: ${policy?.MaxPasswordAge} days`,
        sourceType: "aws.iam.password_policy",
        sourceId: `aws-iam-password-policy-${options.tenantId}`,
        rawData: { ...policy },
        severity: (policy?.MinimumPasswordLength ?? 0) < 14 ? "medium" : "info",
        controlMapping: ["CC6.1", "IA-5", "A.9.4.3"],
        collectedAt: now,
      });
    } catch (err) {
      console.error("[aws] failed to collect password policy:", err);
    }

    // --- IAM Roles ---
    try {
      const rolesResp = await iam.send(new ListRolesCommand({ MaxItems: 500 }));
      results.push({
        title: "IAM Roles Inventory",
        description: `${rolesResp.Roles?.length ?? 0} IAM roles configured`,
        sourceType: "aws.iam.roles",
        sourceId: `aws-iam-roles-${options.tenantId}`,
        rawData: {
          totalRoles: rolesResp.Roles?.length,
          roles: rolesResp.Roles?.map((r) => ({
            name: r.RoleName,
            arn: r.Arn,
            createDate: r.CreateDate,
          })),
        },
        severity: "info",
        controlMapping: ["CC6.1", "AC-2", "A.9.2.3"],
        collectedAt: now,
      });
    } catch (err) {
      console.error("[aws] failed to collect IAM roles:", err);
    }

    // --- CloudTrail ---
    try {
      const trailsResp = await ct.send(new DescribeTrailsCommand({}));
      const trails = trailsResp.trailList ?? [];
      const trailStatuses = [];

      for (const trail of trails) {
        if (trail.TrailARN) {
          const statusResp = await ct.send(new GetTrailStatusCommand({ Name: trail.TrailARN }));
          trailStatuses.push({
            name: trail.Name,
            isLogging: statusResp.IsLogging,
            hasLogFileValidation: trail.LogFileValidationEnabled,
          });
        }
      }

      const allLogging = trailStatuses.every((t) => t.isLogging);
      results.push({
        title: "CloudTrail Configuration",
        description: `${trails.length} trails configured, ${allLogging ? "all logging" : "some not logging"}`,
        sourceType: "aws.cloudtrail.config",
        sourceId: `aws-cloudtrail-${options.tenantId}`,
        rawData: { totalTrails: trails.length, trails: trailStatuses },
        severity: !allLogging || trails.length === 0 ? "critical" : "info",
        controlMapping: ["CC7.2", "AU-2", "AU-3", "A.12.4.1"],
        collectedAt: now,
      });
    } catch (err) {
      console.error("[aws] failed to collect CloudTrail:", err);
    }

    // --- S3 Buckets ---
    try {
      const bucketsResp = await s3.send(new ListBucketsCommand({}));
      const buckets = bucketsResp.Buckets ?? [];
      const bucketDetails = [];

      for (const bucket of buckets.slice(0, 50)) {
        let encrypted = false;
        let publicAccessBlocked = false;

        try {
          await s3.send(new GetBucketEncryptionCommand({ Bucket: bucket.Name }));
          encrypted = true;
        } catch {
          /* no encryption config */
        }

        try {
          const pab = await s3.send(new GetPublicAccessBlockCommand({ Bucket: bucket.Name }));
          publicAccessBlocked = !!(
            pab.PublicAccessBlockConfiguration?.BlockPublicAcls &&
            pab.PublicAccessBlockConfiguration?.BlockPublicPolicy
          );
        } catch {
          /* no public access block */
        }

        bucketDetails.push({ name: bucket.Name, encrypted, publicAccessBlocked });
      }

      const unencrypted = bucketDetails.filter((b) => !b.encrypted).length;
      const publicBuckets = bucketDetails.filter((b) => !b.publicAccessBlocked).length;

      results.push({
        title: "S3 Bucket Security",
        description: `${buckets.length} buckets: ${unencrypted} without encryption, ${publicBuckets} without public access block`,
        sourceType: "aws.s3.security",
        sourceId: `aws-s3-security-${options.tenantId}`,
        rawData: {
          totalBuckets: buckets.length,
          unencrypted,
          publicBuckets,
          buckets: bucketDetails,
        },
        severity: unencrypted > 0 || publicBuckets > 0 ? "high" : "info",
        controlMapping: ["CC6.1", "CC6.7", "SC-28", "A.10.1.1"],
        collectedAt: now,
      });
    } catch (err) {
      console.error("[aws] failed to collect S3:", err);
    }

    // --- Security Groups ---
    try {
      const sgResp = await ec2.send(new DescribeSecurityGroupsCommand({}));
      const groups = sgResp.SecurityGroups ?? [];
      const openGroups = groups.filter((sg) =>
        sg.IpPermissions?.some(
          (perm) =>
            perm.IpRanges?.some((r) => r.CidrIp === "0.0.0.0/0") ||
            perm.Ipv6Ranges?.some((r) => r.CidrIpv6 === "::/0"),
        ),
      );

      results.push({
        title: "VPC Security Groups",
        description: `${groups.length} security groups, ${openGroups.length} with unrestricted inbound rules (0.0.0.0/0)`,
        sourceType: "aws.ec2.security_groups",
        sourceId: `aws-sg-${options.tenantId}`,
        rawData: {
          totalGroups: groups.length,
          openGroups: openGroups.length,
          groups: openGroups.map((sg) => ({ id: sg.GroupId, name: sg.GroupName, vpcId: sg.VpcId })),
        },
        severity: openGroups.length > 0 ? "high" : "info",
        controlMapping: ["CC6.1", "CC6.6", "SC-7", "A.13.1.1"],
        collectedAt: now,
      });
    } catch (err) {
      console.error("[aws] failed to collect security groups:", err);
    }

    // --- VPC Flow Logs ---
    try {
      const flowLogsResp = await ec2.send(new DescribeFlowLogsCommand({}));
      const flowLogs = flowLogsResp.FlowLogs ?? [];
      results.push({
        title: "VPC Flow Logs",
        description: `${flowLogs.length} flow logs configured`,
        sourceType: "aws.ec2.flow_logs",
        sourceId: `aws-flowlogs-${options.tenantId}`,
        rawData: {
          totalFlowLogs: flowLogs.length,
          flowLogs: flowLogs.map((fl) => ({
            id: fl.FlowLogId,
            status: fl.FlowLogStatus,
            resourceId: fl.ResourceId,
          })),
        },
        severity: flowLogs.length === 0 ? "medium" : "info",
        controlMapping: ["CC7.2", "AU-12", "A.12.4.1"],
        collectedAt: now,
      });
    } catch (err) {
      console.error("[aws] failed to collect flow logs:", err);
    }

    console.log(`[aws] collected ${results.length} evidence items for org=${options.tenantId}`);
    return results;
  }

  async testConnection(connection: ProviderConnection): Promise<ConnectionTestResult> {
    try {
      const { credentials, region } = connection.client as AWSClients;
      const sts = new STSClient({ region, credentials });
      const identity = await sts.send(new GetCallerIdentityCommand({}));

      return {
        success: true,
        message: "Successfully authenticated with AWS",
        details: { account: identity.Account, arn: identity.Arn, userId: identity.UserId },
      };
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : "Failed to connect to AWS",
      };
    }
  }

  async disconnect(_connection: ProviderConnection): Promise<void> {
    // IAM role sessions expire naturally
  }

  getRequiredPermissions(): PermissionRequirement[] {
    return [
      {
        resource: "iam",
        permission: "iam:List*",
        description: "List IAM users, roles, and policies",
        required: true,
      },
      {
        resource: "iam",
        permission: "iam:GetCredentialReport",
        description: "Get IAM credential report",
        required: true,
      },
      {
        resource: "iam",
        permission: "iam:GetAccountPasswordPolicy",
        description: "Get account password policy",
        required: true,
      },
      {
        resource: "cloudtrail",
        permission: "cloudtrail:DescribeTrails",
        description: "Describe CloudTrail trails",
        required: true,
      },
      {
        resource: "cloudtrail",
        permission: "cloudtrail:GetTrailStatus",
        description: "Get trail logging status",
        required: true,
      },
      {
        resource: "s3",
        permission: "s3:ListAllMyBuckets",
        description: "List all S3 buckets",
        required: true,
      },
      {
        resource: "s3",
        permission: "s3:GetBucketEncryption",
        description: "Check bucket encryption",
        required: true,
      },
      {
        resource: "s3",
        permission: "s3:GetBucketPublicAccessBlock",
        description: "Check public access settings",
        required: true,
      },
      {
        resource: "ec2",
        permission: "ec2:DescribeSecurityGroups",
        description: "List VPC security groups",
        required: true,
      },
      {
        resource: "ec2",
        permission: "ec2:DescribeFlowLogs",
        description: "List VPC flow logs",
        required: true,
      },
    ];
  }
}
