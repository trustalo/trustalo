import { authenticate as createAuthMiddleware } from "@trustalo/auth";
import { getJwtSecret } from "../config/security.js";

const JWT_SECRET = getJwtSecret();

export const authenticate = createAuthMiddleware(JWT_SECRET, { allowCookie: false });
