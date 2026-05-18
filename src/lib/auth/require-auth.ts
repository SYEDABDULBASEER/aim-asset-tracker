import { getServerAuth, type ServerAuthContext } from "./request-context";
import { canRead, canWrite, type AppRole, type PermissionDomain } from "./roles";
import { allowDemoAuthInDevelopment, isFirebaseConfigured } from "@/lib/firebase/env";

export class AuthError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 401) {
    super(message);
    this.name = "AuthError";
    this.statusCode = statusCode;
  }
}

function requireConfiguredAuth(): ServerAuthContext {
  const auth = getServerAuth();
  if (auth) return auth;

  if (allowDemoAuthInDevelopment() || !isFirebaseConfigured()) {
    return { uid: "demo", email: null, role: "admin" };
  }

  throw new AuthError("Authentication required.", 401);
}

export function requireAuth(): ServerAuthContext {
  return requireConfiguredAuth();
}

export function requireRead(domain: PermissionDomain): ServerAuthContext {
  const auth = requireConfiguredAuth();
  if (!canRead(auth.role, domain)) {
    throw new AuthError("Insufficient permissions.", 403);
  }
  return auth;
}

export function requireWrite(domain: PermissionDomain): ServerAuthContext {
  const auth = requireConfiguredAuth();
  if (!canWrite(auth.role, domain)) {
    throw new AuthError("Insufficient permissions.", 403);
  }
  return auth;
}

export function requireRole(role: AppRole | AppRole[]): ServerAuthContext {
  const auth = requireConfiguredAuth();
  const allowed = Array.isArray(role) ? role : [role];
  if (!allowed.includes(auth.role)) {
    throw new AuthError("Insufficient permissions.", 403);
  }
  return auth;
}
