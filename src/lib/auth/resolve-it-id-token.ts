import { getAuthSessionUser, setAuthSessionUser } from "@/lib/auth/auth-session-ref";
import { staffWorkspaceAuthRequired } from "@/lib/auth/staff-workspace-auth";

/**
 * Resolves the Firebase ID token for IT workspace server function calls.
 * Uses the session ref + Auth singleton (not React state) so the token is available on the first fetch.
 */
export async function resolveItWorkspaceIdToken(): Promise<string | null> {
  if (!staffWorkspaceAuthRequired()) return null;

  const { getFirebaseAuth } = await import("@/lib/firebase/init");
  const auth = getFirebaseAuth();

  // 1. Fast-path check: if user is already available in session or singleton, get token immediately
  const quickUser = getAuthSessionUser() ?? auth.currentUser;
  if (quickUser) {
    try {
      const token = await quickUser.getIdToken();
      if (token) {
        if (!getAuthSessionUser()) setAuthSessionUser(quickUser);
        return token;
      }
    } catch {
      // ignore and proceed to robust wait
    }
  }

  // 2. Wait for auth state to be ready
  try {
    await auth.authStateReady();
  } catch {
    // ignore state ready failure
  }

  // 3. Retry loop
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const user = getAuthSessionUser() ?? auth.currentUser;
    if (user) {
      if (!getAuthSessionUser()) setAuthSessionUser(user);
      try {
        return await user.getIdToken();
      } catch {
        /* retry on next attempt */
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  return null;
}
