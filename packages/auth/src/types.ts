import type { Request } from "express";

export interface AuthPayload {
  userId: string;
  tenantId: string;
  role: string;
  permissions: string[];
  iat?: number;
  exp?: number;
}

export interface TenantContext {
  userId: string;
  tenantId: string;
  role: string;
  permissions: string[];
}

export interface AuthenticatedRequest extends Request {
  auth: TenantContext;
}

export interface JwtConfig {
  secret: string;
  expiresIn: string;
}
