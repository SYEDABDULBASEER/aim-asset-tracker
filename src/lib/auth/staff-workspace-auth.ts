import { isFirebaseConfigured } from "@/lib/firebase/env";

/**
 * IT workspace requires Firebase sign-in whenever the project is configured.
 * Aligns with {@link firebaseAuthRequired} in `env.ts` (same rules on client and server).
 */
export function staffWorkspaceAuthRequired(): boolean {
  return isFirebaseConfigured();
}
