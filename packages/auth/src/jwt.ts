import jwt, { type SignOptions } from "jsonwebtoken";
import type { AuthPayload, JwtConfig } from "./types.js";

export function signToken(payload: Omit<AuthPayload, "iat" | "exp">, config: JwtConfig): string {
  // `expiresIn` is typed as `number | StringValue` (a literal-string union from
  // the `ms` package). Our config carries it as a plain string from env, so we
  // cast through SignOptions["expiresIn"] to satisfy the narrowed type.
  const options: SignOptions = {
    expiresIn: config.expiresIn as SignOptions["expiresIn"],
  };
  return jwt.sign(payload, config.secret, options);
}

export function verifyToken(token: string, secret: string): AuthPayload {
  return jwt.verify(token, secret) as AuthPayload;
}

export function decodeToken(token: string): AuthPayload | null {
  const decoded = jwt.decode(token);
  return decoded as AuthPayload | null;
}
