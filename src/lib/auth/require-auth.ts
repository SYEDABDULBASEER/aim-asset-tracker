import type { ServerAuthContext } from "./request-context";
import { getServerAuth } from "./request-context";
import { firebaseAuthRequired } from "@/lib/firebase/env";
import { canRead, canWrite, type AppRole, type PermissionDomain } from "./roles";

export class AuthError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 401) {
    super(message);
    this.name = "AuthError";
    this.statusCode = statusCode;
  }
}

const OPEN_ACCESS_AUTH: ServerAuthContext = {
  uid: "open-access",
  email: null,
  role: "admin",
};

/**
 * Symbol used to store verified auth directly on the Request object.
 * Set by `authServerFnMiddleware` in start.ts after successful token verification.
 */
const REQUEST_AUTH_SYMBOL = Symbol.for("assetdesk.requestVerifiedAuth");

/**
 * Attach verified auth to a request object so it can be read later
 * by server function handlers even when AsyncLocalStorage context
 * doesn't propagate across Vite SSR module boundaries.
 */
export function attachAuthToRequest(request: Request, auth: ServerAuthContext): void {
  (request as any)[REQUEST_AUTH_SYMBOL] = auth;
}

/**
 * Read verified auth previously stamped on a request object.
 */
function getAuthFromRequest(request: Request): ServerAuthContext | null {
  return (request as any)[REQUEST_AUTH_SYMBOL] ?? null;
}

/**
 * Access the current Request via TanStack Start's own AsyncLocalStorage context.
 *
 * TanStack Start stores its context in a well-known global:
 *   `globalThis[Symbol.for("tanstack-start:start-storage-context")]`
 * This is an AsyncLocalStorage instance whose `.getStore()` returns the
 * TanStack Start context (which includes the `request` property).
 *
 * We access it directly via the global Symbol — NO module import needed —
 * so this works even when Vite SSR creates isolated module instances.
 */
function getCurrentRequest(): Request | null {
  try {
    const TANSTACK_STORAGE_KEY = Symbol.for("tanstack-start:start-storage-context");
    const storage = (globalThis as any)[TANSTACK_STORAGE_KEY];
    if (!storage || typeof storage.getStore !== "function") return null;
    const store = storage.getStore();
    return store?.request ?? null;
  } catch {
    return null;
  }
}

function requireConfiguredAuth(): ServerAuthContext {
  if (!firebaseAuthRequired()) {
    return OPEN_ACCESS_AUTH;
  }

  // 1. Try the AsyncLocalStorage context (set by start.ts middleware)
  const alsAuth = getServerAuth();
  if (alsAuth) return alsAuth;

  // 2. Fallback: read auth from the Request object via TanStack's own context
  //    This bypasses Vite SSR module isolation issues with our own ALS
  const request = getCurrentRequest();
  if (request) {
    const reqAuth = getAuthFromRequest(request);
    if (reqAuth) return reqAuth;
  }

  throw new AuthError("Sign in required.", 401);
}

export function requireAuth(): ServerAuthContext {
  return requireConfiguredAuth();
}

export function requireRead(domain: PermissionDomain): ServerAuthContext {
  const auth = requireConfiguredAuth();
  if (firebaseAuthRequired() && !canRead(auth.role, domain)) {
    throw new AuthError("You do not have access to this data.", 403);
  }
  return auth;
}

export function requireWrite(domain: PermissionDomain): ServerAuthContext {
  const auth = requireConfiguredAuth();
  if (firebaseAuthRequired() && !canWrite(auth.role, domain)) {
    throw new AuthError("You do not have permission to modify this data.", 403);
  }
  return auth;
}

export function requireRole(role: AppRole | AppRole[]): ServerAuthContext {
  const auth = requireConfiguredAuth();
  const allowed = Array.isArray(role) ? role : [role];
  if (firebaseAuthRequired() && !allowed.includes(auth.role)) {
    throw new AuthError("This action requires a different role.", 403);
  }
  return auth;
}
