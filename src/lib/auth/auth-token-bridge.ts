import { firebaseAuthRequired, isFirebaseConfigured } from "@/lib/firebase/env";

/** Optional override from AuthProvider; defaults to Firebase `currentUser`. */
let getIdTokenFromSession: (() => Promise<string | null>) | null = null;

export function registerServerFnIdTokenProvider(provider: () => Promise<string | null>): void {
  getIdTokenFromSession = provider;
}

async function readTokenFromFirebaseAuth(): Promise<string | null> {
  if (!isFirebaseConfigured()) return null;

  const { getFirebaseAuth } = await import("@/lib/firebase/init");
  const auth = getFirebaseAuth();
  await auth.authStateReady();

  let user = auth.currentUser;
  if (!user && firebaseAuthRequired()) {
    for (let attempt = 0; attempt < 20 && !user; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 50));
      user = auth.currentUser;
    }
  }

  if (!user) return null;
  return user.getIdToken();
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

  return readTokenFromFirebaseAuth();
}

registerServerFnIdTokenProvider(() => readTokenFromFirebaseAuth());
