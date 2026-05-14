import { authenticate } from "@trustalo/auth";
import { getJwtSecret } from "../config/security.js";

const JWT_SECRET = getJwtSecret();

export const authMiddleware = authenticate(JWT_SECRET);
