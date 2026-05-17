import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { Prisma } from "../../generated/prisma/client/index.js";
import { AINotConfiguredError, AIProviderError } from "@trustalo/ai";
import { EnterpriseLicenseError } from "@trustalo/license";
import { isSaaSMode, scrubSecrets } from "../config/deployment.js";

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    fields?: Record<string, string[]>;
  };
}

/**
 * HTTP status mapping for provider error kinds. We map auth failures
 * to 503 (not 401) — a 401 here would prompt the SPA to log the user
 * out, but the user is fine; it's our upstream credentials that broke.
 */
function statusForAIProvider(err: AIProviderError): number {
  switch (err.kind) {
    case "auth":
      return 503;
    case "rate_limit":
      return 429;
    case "timeout":
      return 504;
    case "bad_request":
      return 422;
    case "server_error":
    case "unavailable":
      return 503;
    case "unknown":
    default:
      return 502;
  }
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  // Always log the FULL error server-side. SaaS-mode scrubbing only
  // applies to the response body — operators reading logs need the
  // upstream detail to debug.
  console.error("[error]", err);

  if (err instanceof ZodError) {
    const fields: Record<string, string[]> = {};
    for (const issue of err.issues) {
      const path = issue.path.join(".");
      if (!fields[path]) fields[path] = [];
      fields[path].push(issue.message);
    }

    const body: ErrorResponse = {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed",
        fields,
      },
    };
    res.status(400).json(body);
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002": {
        const target = (err.meta?.target as string[])?.join(", ") ?? "field";
        res.status(409).json({
          success: false,
          error: { code: "CONFLICT", message: `Unique constraint violation on ${target}` },
        } satisfies ErrorResponse);
        return;
      }
      case "P2025":
        res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "Record not found" },
        } satisfies ErrorResponse);
        return;
      default:
        res.status(400).json({
          success: false,
          // In SaaS mode, db error messages can echo column/table
          // names that we'd rather keep internal. Always pass through
          // the secret scrubber.
          error: {
            code: "DATABASE_ERROR",
            message: isSaaSMode() ? "Database error" : scrubSecrets(err.message),
          },
        } satisfies ErrorResponse);
        return;
    }
  }

  if (err instanceof AINotConfiguredError) {
    res.status(503).json({
      success: false,
      error: { code: "AI_NOT_CONFIGURED", message: err.message },
    } satisfies ErrorResponse);
    return;
  }

  // Enterprise License gate hit on an EE-only feature. 402 Payment
  // Required is the right semantic — the request is well-formed and
  // the user is authenticated, but the deployment lacks (or has an
  // expired/revoked/feature-mismatched) license. The response carries
  // the failing feature id and a stable error code so the SPA can show
  // a "Contact sales for Enterprise" panel without parsing strings.
  if (err instanceof EnterpriseLicenseError) {
    res.status(402).json({
      success: false,
      error: {
        code: `ENTERPRISE_LICENSE_${err.code.toUpperCase()}`,
        message: `Trustalo Enterprise License required for "${err.featureId}" feature.`,
      },
    } satisfies ErrorResponse);
    return;
  }

  // AI provider errors (OpenAI 401, Anthropic rate-limit, Bedrock
  // throttling, etc.) carry a pre-baked, secret-free `publicMessage`.
  // We still pass it through `scrubSecrets` as belt-and-braces.
  if (err instanceof AIProviderError) {
    res.status(statusForAIProvider(err)).json({
      success: false,
      error: {
        code: `AI_PROVIDER_${err.kind.toUpperCase()}`,
        message: scrubSecrets(err.publicMessage),
      },
    } satisfies ErrorResponse);
    return;
  }

  if (err instanceof Error && "status" in err) {
    const e = err as Error & { status: number; code?: string };
    res.status(e.status).json({
      success: false,
      // Honor the error's own `code` when it provides one (e.g. AuthError,
      // InvalidCredentialsError). Falling back to "REQUEST_ERROR" preserves
      // backwards-compatibility for callers that throw plain { status, message }.
      error: {
        code: e.code ?? "REQUEST_ERROR",
        message: scrubSecrets(e.message),
      },
    } satisfies ErrorResponse);
    return;
  }

  // Unknown / unhandled. Never echo upstream messages to the user in
  // SaaS mode — we don't know what they contain. Self-hosted admins
  // get the scrubbed message so they can debug their own deploy.
  const fallback = "An unexpected error occurred. Please try again or contact support.";
  const rawMessage = err instanceof Error ? err.message : String(err);
  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message: isSaaSMode() ? fallback : scrubSecrets(rawMessage) || fallback,
    },
  } satisfies ErrorResponse);
}
