import { allowDemoAuthInDevelopment, isFirebaseConfigured } from "@/lib/firebase/env";

/**
 * IT workspace requires Firebase sign-in whenever the project is configured.
 * In local dev, `VITE_ALLOW_DEMO_AUTH=true` disables enforcement so Firestore data can load without tokens.
 */
export function staffWorkspaceAuthRequired(): boolean {
  if (!isFirebaseConfigured()) return false;
  if (allowDemoAuthInDevelopment()) return false;
  return true;
}
