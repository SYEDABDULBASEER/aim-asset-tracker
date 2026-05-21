import { staffWorkspaceAuthRequired } from "@/lib/auth/staff-workspace-auth";

/**
 * Single check for IT workspace Firebase sign-in (client guards + server middleware).
 * Use this instead of mixing `firebaseAuthRequired()` and `staffWorkspaceAuthRequired()`.
 */
export function isItStaffAuthEnforced(): boolean {
  return staffWorkspaceAuthRequired();
}
