// SPDX-License-Identifier: LicenseRef-Trustalo-Enterprise-1.0

import { createHash } from "node:crypto";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { assertEnterpriseLicense } from "@trustalo/license";
import { prisma } from "../../db/prisma.js";
import { decryptStringMaybe, encryptStringMaybe } from "../../lib/crypto-envelope.js";

export const DIRECTORY_SYNC_FREQUENCIES = [1440, 10080] as const;

const membershipRoleSchema = z.enum([
  "admin",
  "compliance_manager",
  "auditor",
  "viewer",
  "integration_admin",
  "dpo",
]);

const groupRoleMappingSchema = z.object({
  externalGroupId: z.string().trim().min(1),
  externalGroupName: z.string().trim().optional().nullable(),
  role: membershipRoleSchema,
});

const defaultStatusSchema = z.enum(["active", "invited"]);

const entraCredentialsSchema = z.object({
  tenantId: z.string().trim().min(1),
  clientId: z.string().trim().min(1),
  clientSecret: z.string().trim().min(1),
});

const googleWorkspaceCredentialsSchema = z.object({
  serviceAccountJson: z.string().trim().min(1),
  adminEmail: z.string().email(),
});

export const directoryProviderSchema = z.enum(["entra", "google_workspace"]);

export const upsertDirectorySyncConfigSchema = z.object({
  isEnabled: z.boolean().default(true),
  syncFrequencyMinutes: z.union([z.literal(1440), z.literal(10080)]).default(1440),
  defaultRole: membershipRoleSchema.default("viewer"),
  defaultStatus: defaultStatusSchema.default("invited"),
  groupRoleMappings: z.array(groupRoleMappingSchema).max(50).default([]),
  credentials: z.union([entraCredentialsSchema, googleWorkspaceCredentialsSchema]),
});

type DirectoryProvider = z.infer<typeof directoryProviderSchema>;
type DefaultStatus = z.infer<typeof defaultStatusSchema>;
type GroupRoleMapping = z.infer<typeof groupRoleMappingSchema>;
type EntraCredentials = z.infer<typeof entraCredentialsSchema>;
type GoogleWorkspaceCredentials = z.infer<typeof googleWorkspaceCredentialsSchema>;

interface ExternalDirectoryUser {
  externalId: string;
  email: string;
  displayName: string | null;
  isActive: boolean;
  groupIds: string[];
}

const PROVIDER_REQUEST_TIMEOUT_MS = 60_000;

async function fetchWithTimeout(
  input: string | URL,
  init?: RequestInit,
  timeoutMs = PROVIDER_REQUEST_TIMEOUT_MS,
) {
  return fetch(input, {
    ...init,
    signal: AbortSignal.timeout(timeoutMs),
  });
}

export async function listDirectorySyncConfigs(tenantId: string) {
  const rows = await prisma.directorySyncConfig.findMany({
    where: { tenantId },
    orderBy: { provider: "asc" },
  });
  return rows.map((row) => ({
    id: row.id,
    provider: row.provider,
    isEnabled: row.isEnabled,
    syncFrequencyMinutes: row.syncFrequencyMinutes,
    defaultRole: row.defaultRole,
    defaultStatus: row.defaultStatus,
    groupRoleMappings: parseGroupRoleMappings(row.groupRoleMappings),
    lastSyncAt: row.lastSyncAt,
    lastSyncStatus: row.lastSyncStatus,
    lastSyncError: row.lastSyncError,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    hasCredentials: true,
  }));
}

export async function upsertDirectorySyncConfig(
  tenantId: string,
  provider: DirectoryProvider,
  input: z.infer<typeof upsertDirectorySyncConfigSchema>,
) {
  const parsed = upsertDirectorySyncConfigSchema.parse(input);
  validateProviderCredentials(provider, parsed.credentials);

  const encryptedCredentials = encryptStringMaybe(JSON.stringify(parsed.credentials));
  if (!encryptedCredentials) {
    throw createHttpError(400, "Credentials are required", "VALIDATION_ERROR");
  }

  const config = await prisma.directorySyncConfig.upsert({
    where: {
      tenantId_provider: {
        tenantId,
        provider,
      },
    },
    create: {
      tenantId,
      provider,
      isEnabled: parsed.isEnabled,
      syncFrequencyMinutes: parsed.syncFrequencyMinutes,
      defaultRole: parsed.defaultRole,
      defaultStatus: parsed.defaultStatus,
      groupRoleMappings: parsed.groupRoleMappings,
      encryptedCredentials,
    },
    update: {
      isEnabled: parsed.isEnabled,
      syncFrequencyMinutes: parsed.syncFrequencyMinutes,
      defaultRole: parsed.defaultRole,
      defaultStatus: parsed.defaultStatus,
      groupRoleMappings: parsed.groupRoleMappings,
      encryptedCredentials,
      lastSyncError: null,
    },
  });

  return {
    id: config.id,
    provider: config.provider,
    isEnabled: config.isEnabled,
    syncFrequencyMinutes: config.syncFrequencyMinutes,
    defaultRole: config.defaultRole,
    defaultStatus: config.defaultStatus,
    groupRoleMappings: parseGroupRoleMappings(config.groupRoleMappings),
    lastSyncAt: config.lastSyncAt,
    lastSyncStatus: config.lastSyncStatus,
    lastSyncError: config.lastSyncError,
    createdAt: config.createdAt,
    updatedAt: config.updatedAt,
    hasCredentials: true,
  };
}

export async function testDirectorySyncConfig(
  tenantId: string,
  provider: DirectoryProvider,
  credentialsInput?: unknown,
) {
  const existing = await prisma.directorySyncConfig.findUnique({
    where: { tenantId_provider: { tenantId, provider } },
  });

  const credentials = credentialsInput
    ? parseProviderCredentials(provider, credentialsInput)
    : await getProviderCredentialsOrThrow(existing, provider);

  const users = await fetchDirectoryUsers(provider, credentials, {
    includeGroups: false,
    maxUsers: 10,
  });
  return {
    provider,
    usersSampled: users.length,
    success: true,
  };
}

export async function deleteDirectorySyncConfig(tenantId: string, provider: DirectoryProvider) {
  const existing = await prisma.directorySyncConfig.findUnique({
    where: { tenantId_provider: { tenantId, provider } },
    select: { id: true },
  });
  if (!existing) {
    throw createHttpError(404, "Directory sync config not found", "NOT_FOUND");
  }

  await prisma.directorySyncConfig.delete({ where: { id: existing.id } });
}

export async function listDirectorySyncRuns(
  tenantId: string,
  provider?: DirectoryProvider,
  limit = 20,
) {
  return prisma.directorySyncRun.findMany({
    where: {
      tenantId,
      ...(provider ? { provider } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: Math.min(100, Math.max(1, limit)),
  });
}

export async function enqueueDirectorySyncRun(
  tenantId: string,
  provider: DirectoryProvider,
  triggeredBy: "manual" | "schedule",
) {
  const run = await prisma.$transaction(async (tx) => {
    const config = await tx.directorySyncConfig.findUnique({
      where: { tenantId_provider: { tenantId, provider } },
    });
    if (!config) {
      throw createHttpError(404, "Directory sync config not found", "NOT_FOUND");
    }
    if (!config.isEnabled && triggeredBy === "schedule") {
      return null;
    }

    const lockRows = (await tx.$queryRaw`
      SELECT pg_try_advisory_xact_lock(
        hashtext('directory_sync_run'),
        hashtext(${config.id})
      ) AS locked
    `) as Array<{ locked: boolean }>;
    if (!lockRows[0]?.locked) {
      return null;
    }

    const inFlight = await tx.directorySyncRun.findFirst({
      where: {
        configId: config.id,
        status: { in: ["pending", "running"] },
      },
      select: { id: true },
    });
    if (inFlight) {
      return null;
    }

    return tx.directorySyncRun.create({
      data: {
        tenantId,
        configId: config.id,
        provider,
        status: "pending",
        triggeredBy,
      },
    });
  });

  if (!run) return null;

  setImmediate(() => {
    void executeDirectorySyncRun(run.id);
  });

  return run;
}

export async function executeDirectorySyncRun(runId: string): Promise<void> {
  const run = await prisma.directorySyncRun.findUnique({
    where: { id: runId },
    include: { config: true },
  });
  if (!run || run.status !== "pending") return;

  const startTime = new Date();

  await prisma.directorySyncRun.update({
    where: { id: run.id },
    data: { status: "running", startedAt: startTime, errorMessage: null },
  });

  try {
    const credentials = await getProviderCredentialsOrThrow(run.config, run.provider);
    const groupRoleMappings = parseGroupRoleMappings(run.config.groupRoleMappings);
    const users = await fetchDirectoryUsers(run.provider, credentials, {
      includeGroups: groupRoleMappings.length > 0,
    });
    const seenExternalIds = new Set<string>();

    let usersCreated = 0;
    let usersUpdated = 0;
    let usersSuspended = 0;

    for (const extUser of users) {
      seenExternalIds.add(extUser.externalId);

      const resolvedRole = resolveRoleForUser(
        extUser.groupIds,
        groupRoleMappings,
        run.config.defaultRole as z.infer<typeof membershipRoleSchema>,
      );
      const desiredStatus = resolveMembershipStatus(extUser.isActive, run.config.defaultStatus);
      const email = extUser.email.toLowerCase();
      const displayName = extUser.displayName ?? email.split("@")[0] ?? "Directory User";

      const mapping = await prisma.externalIdentityMapping.findUnique({
        where: {
          tenantId_provider_externalId: {
            tenantId: run.tenantId,
            provider: run.provider,
            externalId: extUser.externalId,
          },
        },
      });

      let user = mapping
        ? await prisma.user.findUnique({ where: { id: mapping.userId } })
        : await prisma.user.findUnique({ where: { email } });

      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            name: displayName,
            emailVerified: true,
          },
        });
        usersCreated += 1;
      }

      // People replaced Membership: upsert the Person directory record so the
      // synced user can log in (auth resolves a user's Person, not Membership).
      // Find by userId, else adopt a login-less Person with the same email.
      let person =
        (await prisma.person.findFirst({
          where: { tenantId: run.tenantId, userId: user.id },
        })) ??
        (await prisma.person.findFirst({
          where: { tenantId: run.tenantId, email },
        }));

      if (!person) {
        await prisma.person.create({
          data: {
            userId: user.id,
            tenantId: run.tenantId,
            email,
            fullName: displayName,
            role: resolvedRole,
            status: desiredStatus,
            source: "directory_sync",
            invitedAt: desiredStatus === "invited" ? startTime : null,
            joinedAt: desiredStatus === "active" ? startTime : null,
            permissions: [],
          },
        });
        usersUpdated += 1;
      } else if (person.role !== "owner") {
        const patch: Record<string, unknown> = {};
        if (!person.userId) patch.userId = user.id;
        if (person.role !== resolvedRole) patch.role = resolvedRole;
        if (person.status !== desiredStatus) {
          patch.status = desiredStatus;
          if (desiredStatus === "active" && !person.joinedAt) patch.joinedAt = startTime;
        }
        if (Object.keys(patch).length > 0) {
          await prisma.person.update({ where: { id: person.id }, data: patch });
          usersUpdated += 1;
        }
      }

      await prisma.externalIdentityMapping.upsert({
        where: {
          tenantId_provider_externalId: {
            tenantId: run.tenantId,
            provider: run.provider,
            externalId: extUser.externalId,
          },
        },
        create: {
          tenantId: run.tenantId,
          configId: run.configId,
          provider: run.provider,
          externalId: extUser.externalId,
          userId: user.id,
          externalEmail: email,
          externalDisplayName: extUser.displayName,
          externalGroupIds: extUser.groupIds,
          lastSeenAt: startTime,
        },
        update: {
          configId: run.configId,
          userId: user.id,
          externalEmail: email,
          externalDisplayName: extUser.displayName,
          externalGroupIds: extUser.groupIds,
          lastSeenAt: startTime,
        },
      });
    }

    const staleMappings = await prisma.externalIdentityMapping.findMany({
      where: {
        tenantId: run.tenantId,
        provider: run.provider,
        configId: run.configId,
        lastSeenAt: { lt: startTime },
      },
      select: { userId: true },
    });

    for (const stale of staleMappings) {
      const person = await prisma.person.findFirst({
        where: { tenantId: run.tenantId, userId: stale.userId },
      });
      if (!person || person.role === "owner" || person.status === "suspended") continue;
      await prisma.person.update({
        where: { id: person.id },
        data: { status: "suspended" },
      });
      usersSuspended += 1;
    }

    await prisma.directorySyncRun.update({
      where: { id: run.id },
      data: {
        status: "succeeded",
        finishedAt: new Date(),
        usersDiscovered: users.length,
        usersCreated,
        usersUpdated,
        usersSuspended,
      },
    });

    await prisma.directorySyncConfig.update({
      where: { id: run.configId },
      data: {
        lastSyncAt: new Date(),
        lastSyncStatus: "succeeded",
        lastSyncError: null,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Directory sync failed";
    await prisma.directorySyncRun.update({
      where: { id: run.id },
      data: {
        status: "failed",
        finishedAt: new Date(),
        errorMessage: message,
      },
    });
    await prisma.directorySyncConfig.update({
      where: { id: run.configId },
      data: {
        lastSyncAt: new Date(),
        lastSyncStatus: "failed",
        lastSyncError: message,
      },
    });
  }
}

function resolveMembershipStatus(isActive: boolean, defaultStatus: DefaultStatus) {
  if (!isActive) return "suspended" as const;
  return defaultStatus;
}

function resolveRoleForUser(
  userGroupIds: string[],
  mappings: GroupRoleMapping[],
  fallbackRole: z.infer<typeof membershipRoleSchema>,
) {
  if (mappings.length === 0 || userGroupIds.length === 0) return fallbackRole;
  const role = mappings.find((mapping) => userGroupIds.includes(mapping.externalGroupId))?.role;
  return role ?? fallbackRole;
}

function parseGroupRoleMappings(raw: unknown): GroupRoleMapping[] {
  const parsed = z.array(groupRoleMappingSchema).safeParse(raw ?? []);
  return parsed.success ? parsed.data : [];
}

function parseProviderCredentials(provider: DirectoryProvider, input: unknown) {
  if (provider === "entra") return entraCredentialsSchema.parse(input) as EntraCredentials;
  return googleWorkspaceCredentialsSchema.parse(input) as GoogleWorkspaceCredentials;
}

function validateProviderCredentials(provider: DirectoryProvider, credentials: unknown) {
  parseProviderCredentials(provider, credentials);
}

async function getProviderCredentialsOrThrow(
  config: { encryptedCredentials: string } | null,
  provider: DirectoryProvider,
) {
  if (!config) throw createHttpError(404, "Directory sync config not found", "NOT_FOUND");
  const decrypted = decryptStringMaybe(config.encryptedCredentials);
  if (!decrypted) throw createHttpError(400, "Missing encrypted credentials", "VALIDATION_ERROR");
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(decrypted);
  } catch {
    throw createHttpError(400, "Invalid encrypted credentials payload", "VALIDATION_ERROR");
  }
  return parseProviderCredentials(provider, parsedJson);
}

async function fetchDirectoryUsers(
  provider: DirectoryProvider,
  credentials: EntraCredentials | GoogleWorkspaceCredentials,
  options: { includeGroups: boolean; maxUsers?: number },
): Promise<ExternalDirectoryUser[]> {
  if (provider === "entra") {
    return fetchEntraUsers(credentials as EntraCredentials, options);
  }
  return fetchGoogleWorkspaceUsers(credentials as GoogleWorkspaceCredentials, options);
}

async function fetchEntraUsers(
  credentials: EntraCredentials,
  options: { includeGroups: boolean; maxUsers?: number },
): Promise<ExternalDirectoryUser[]> {
  const tokenResp = await fetchWithTimeout(
    `https://login.microsoftonline.com/${encodeURIComponent(credentials.tenantId)}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: credentials.clientId,
        client_secret: credentials.clientSecret,
        scope: "https://graph.microsoft.com/.default",
        grant_type: "client_credentials",
      }),
    },
  );
  if (!tokenResp.ok) {
    const body = await tokenResp.text();
    throw new Error(`Entra token request failed: ${tokenResp.status} ${body}`);
  }
  const tokenData = (await tokenResp.json()) as { access_token?: string };
  if (!tokenData.access_token) throw new Error("Entra token response did not include access_token");

  const users: ExternalDirectoryUser[] = [];
  let nextUrl =
    "https://graph.microsoft.com/v1.0/users?$select=id,displayName,mail,userPrincipalName,accountEnabled";
  const maxUsers = options.maxUsers ?? 5000;

  while (nextUrl && users.length < maxUsers) {
    const response = await fetchWithTimeout(nextUrl, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Entra users request failed: ${response.status} ${body}`);
    }
    const page = (await response.json()) as {
      value?: Array<Record<string, unknown>>;
      "@odata.nextLink"?: string;
    };
    for (const row of page.value ?? []) {
      if (users.length >= maxUsers) break;
      const email =
        typeof row.mail === "string" && row.mail.trim().length > 0
          ? row.mail
          : typeof row.userPrincipalName === "string"
            ? row.userPrincipalName
            : null;
      const id = typeof row.id === "string" ? row.id : null;
      if (!id || !email) continue;
      users.push({
        externalId: id,
        email,
        displayName: typeof row.displayName === "string" ? row.displayName : null,
        isActive: row.accountEnabled !== false,
        groupIds: [],
      });
    }
    nextUrl = page["@odata.nextLink"] ?? "";
  }

  if (options.includeGroups) {
    for (const user of users) {
      const response = await fetchWithTimeout(
        `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(
          user.externalId,
        )}/memberOf?$select=id`,
        {
          headers: { Authorization: `Bearer ${tokenData.access_token}` },
        },
      );
      if (!response.ok) continue;
      const groupPage = (await response.json()) as { value?: Array<Record<string, unknown>> };
      user.groupIds = (groupPage.value ?? [])
        .map((group) => (typeof group.id === "string" ? group.id : ""))
        .filter(Boolean);
    }
  }

  return users;
}

async function fetchGoogleWorkspaceUsers(
  credentials: GoogleWorkspaceCredentials,
  options: { includeGroups: boolean; maxUsers?: number },
): Promise<ExternalDirectoryUser[]> {
  const parsedKey = z
    .object({
      client_email: z.string().email(),
      private_key: z.string().min(1),
      token_uri: z.string().url().optional(),
    })
    .parse(JSON.parse(credentials.serviceAccountJson));

  const now = Math.floor(Date.now() / 1000);
  const tokenUri = parsedKey.token_uri ?? "https://oauth2.googleapis.com/token";
  const assertion = jwt.sign(
    {
      iss: parsedKey.client_email,
      sub: credentials.adminEmail,
      aud: tokenUri,
      scope:
        "https://www.googleapis.com/auth/admin.directory.user.readonly https://www.googleapis.com/auth/admin.directory.group.readonly https://www.googleapis.com/auth/admin.directory.group.member.readonly",
      iat: now,
      exp: now + 3600,
    },
    parsedKey.private_key,
    { algorithm: "RS256" },
  );

  const tokenResp = await fetchWithTimeout(tokenUri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  if (!tokenResp.ok) {
    const body = await tokenResp.text();
    throw new Error(`Google Workspace token request failed: ${tokenResp.status} ${body}`);
  }
  const tokenData = (await tokenResp.json()) as { access_token?: string };
  if (!tokenData.access_token) {
    throw new Error("Google Workspace token response did not include access_token");
  }

  const users: ExternalDirectoryUser[] = [];
  let pageToken = "";
  const maxUsers = options.maxUsers ?? 5000;
  do {
    const url = new URL("https://admin.googleapis.com/admin/directory/v1/users");
    url.searchParams.set("customer", "my_customer");
    url.searchParams.set("maxResults", "500");
    url.searchParams.set("projection", "basic");
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const response = await fetchWithTimeout(url, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Google Workspace users request failed: ${response.status} ${body}`);
    }

    const payload = (await response.json()) as {
      users?: Array<Record<string, unknown>>;
      nextPageToken?: string;
    };
    for (const user of payload.users ?? []) {
      if (users.length >= maxUsers) break;
      const id = typeof user.id === "string" ? user.id : null;
      const email = typeof user.primaryEmail === "string" ? user.primaryEmail : null;
      if (!id || !email) continue;
      users.push({
        externalId: id,
        email,
        displayName:
          typeof user.name === "object" ? String((user.name as any).fullName ?? "") : null,
        isActive: user.suspended !== true,
        groupIds: [],
      });
    }
    pageToken = payload.nextPageToken ?? "";
  } while (pageToken && users.length < maxUsers);

  if (options.includeGroups) {
    for (const user of users) {
      const groupsUrl = new URL("https://admin.googleapis.com/admin/directory/v1/groups");
      groupsUrl.searchParams.set("userKey", user.email);
      const response = await fetchWithTimeout(groupsUrl, {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      if (!response.ok) continue;
      const payload = (await response.json()) as { groups?: Array<Record<string, unknown>> };
      user.groupIds = (payload.groups ?? [])
        .map((group) => {
          if (typeof group.id === "string") return group.id;
          if (typeof group.email === "string") return `email:${group.email.toLowerCase()}`;
          return "";
        })
        .filter(Boolean);
    }
  }

  return users;
}

export async function enqueueDueDirectorySyncRuns() {
  await assertEnterpriseLicense("sso");
  const now = new Date();
  const configs = await prisma.directorySyncConfig.findMany({
    where: {
      isEnabled: true,
      OR: [
        { lastSyncAt: null },
        {
          AND: [
            { syncFrequencyMinutes: 1440 },
            { lastSyncAt: { lte: new Date(now.getTime() - 1440 * 60_000) } },
          ],
        },
        {
          AND: [
            { syncFrequencyMinutes: 10080 },
            { lastSyncAt: { lte: new Date(now.getTime() - 10080 * 60_000) } },
          ],
        },
      ],
    },
    select: { tenantId: true, provider: true },
  });

  for (const config of configs) {
    await enqueueDirectorySyncRun(
      config.tenantId,
      config.provider as DirectoryProvider,
      "schedule",
    );
  }
}

export function getConfigSignature(config: {
  provider: string;
  syncFrequencyMinutes: number;
  defaultRole: string;
  defaultStatus: string;
  isEnabled: boolean;
  groupRoleMappings: unknown;
}) {
  const raw = JSON.stringify({
    provider: config.provider,
    syncFrequencyMinutes: config.syncFrequencyMinutes,
    defaultRole: config.defaultRole,
    defaultStatus: config.defaultStatus,
    isEnabled: config.isEnabled,
    groupRoleMappings: config.groupRoleMappings,
  });
  return createHash("sha256").update(raw).digest("hex");
}

function createHttpError(status: number, message: string, code?: string) {
  const err = new Error(message) as Error & { status: number; code?: string };
  err.status = status;
  err.code = code;
  return err;
}
