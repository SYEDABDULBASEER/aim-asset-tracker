import { FIREBASE_ID_TOKEN_HEADER } from "@/lib/auth/auth-headers";
import { resolveItWorkspaceIdToken } from "@/lib/auth/resolve-it-id-token";
import { staffWorkspaceAuthRequired } from "@/lib/auth/staff-workspace-auth";

/** Appends Firebase Bearer headers when an IT workspace session exists. */
export async function appendFirebaseAuthHeader(headers: Headers): Promise<void> {
  if (!staffWorkspaceAuthRequired() || headers.has("Authorization")) return;

  const token = await resolveItWorkspaceIdToken();
  if (!token) return;

  const bearer = `Bearer ${token}`;
  headers.set("Authorization", bearer);
  headers.set(FIREBASE_ID_TOKEN_HEADER, bearer);
}
