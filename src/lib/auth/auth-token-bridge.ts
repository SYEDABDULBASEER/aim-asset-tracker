import { getAuthSessionUser } from "@/lib/auth/auth-session-ref";
import { resolveItWorkspaceIdToken } from "@/lib/auth/resolve-it-id-token";
import { isFirebaseConfigured } from "@/lib/firebase/env";

/** Optional override from AuthProvider; defaults to session ref + Firebase Auth singleton. */
let getIdTokenFromSession: (() => Promise<string | null>) | null = null;

export function registerServerFnIdTokenProvider(provider: () => Promise<string | null>): void {
  getIdTokenFromSession = provider;
}

export async function resolveServerFnIdToken(): Promise<string | null> {
  if (getIdTokenFromSession) {
    try {
      const token = await getIdTokenFromSession();
      if (token) return token;
    } catch (error) {
      console.warn("resolveServerFnIdToken: session provider failed", error);
    }
  }

  return resolveItWorkspaceIdToken();
}

/** @deprecated Use resolveItWorkspaceIdToken */
export async function getFirebaseIdTokenForServerFn(): Promise<string | null> {
  if (!isFirebaseConfigured()) return null;
  return resolveItWorkspaceIdToken();
}

/** @deprecated Use resolveItWorkspaceIdToken */
export async function waitForServerFnIdToken(maxAttempts = 60): Promise<string | null> {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const token = await resolveItWorkspaceIdToken();
    if (token) return token;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  return null;
}

registerServerFnIdTokenProvider(() => resolveItWorkspaceIdToken());
