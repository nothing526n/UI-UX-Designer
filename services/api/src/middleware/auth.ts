import { Request, Response, NextFunction } from "express";
import * as crypto from "crypto";
import { AuthUserContext, MembershipRole } from "@platform/contracts";
import { dataStore } from "../store.js";

// Extend Express Request with user context
declare global {
  namespace Express {
    interface Request {
      user?: AuthUserContext;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || "platform_foundation_secret_key_change_in_prod";

/**
 * Creates a signed HS256 JWT string using Node crypto
 */
export function signDevJwt(payload: Record<string, any>, expiresInSeconds: number = 86400): string {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const b64Header = Buffer.from(JSON.stringify(header)).toString("base64url");
  const b64Payload = Buffer.from(JSON.stringify(fullPayload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${b64Header}.${b64Payload}`)
    .digest("base64url");

  return `${b64Header}.${b64Payload}.${signature}`;
}

/**
 * Verifies HS256 JWT string using Node crypto
 */
export function verifyDevJwt(token: string): Record<string, any> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [b64Header, b64Payload, signature] = parts;

    const expectedSig = crypto
      .createHmac("sha256", JWT_SECRET)
      .update(`${b64Header}.${b64Payload}`)
      .digest("base64url");

    if (signature !== expectedSig) return null;

    const payload = JSON.parse(Buffer.from(b64Payload, "base64url").toString());
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null; // Expired
    }
    return payload;
  } catch {
    return null;
  }
}

/**
 * Authentication middleware
 * Supports:
 * 1. Bearer <jwt>
 * 2. Dev headers (X-Dev-User-Id, X-Dev-Org-Id)
 * 3. Fallback to default admin context for local developer convenience
 */
export function authenticate(req: Request, res: Response, next: NextFunction) {
  // 1. Check Bearer token
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7).trim();
    const payload = verifyDevJwt(token);
    if (payload) {
      req.user = {
        id: payload.sub || payload.id,
        email: payload.email || "user@platform.local",
        name: payload.name || "Authenticated User",
        activeOrganizationId: payload.orgId || "org_apex_global",
        roles: (payload.roles as MembershipRole[]) || ["MEMBER"],
      };
      return next();
    }
  }

  // 2. Check dev headers
  const devUserId = req.headers["x-dev-user-id"] as string | undefined;
  const devOrgId = req.headers["x-dev-org-id"] as string | undefined;
  if (devUserId) {
    const orgId = devOrgId || "org_apex_global";
    const membership = dataStore.getMembership(orgId, devUserId);
    req.user = {
      id: devUserId,
      email: `${devUserId}@platform.local`,
      name: `Developer (${devUserId})`,
      activeOrganizationId: orgId,
      roles: membership ? [membership.role] : ["MEMBER"],
    };
    return next();
  }

  // 3. Default fallback for studio local dev mode (if none provided)
  req.user = {
    id: "usr_admin",
    email: "admin@apexlogistics.com",
    name: "Alex Vance (Lead Architect)",
    activeOrganizationId: "org_apex_global",
    roles: ["OWNER", "ADMIN"],
  };

  next();
}

/**
 * Strict authentication guard for protected endpoints
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Missing or invalid authentication token. Provide 'Authorization: Bearer <token>' or 'X-Dev-User-Id'.",
      },
    });
  }
  next();
}
