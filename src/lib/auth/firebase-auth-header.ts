import { firebaseAuthRequired } from "@/lib/firebase/env";
import { resolveServerFnIdToken } from "@/lib/auth/auth-token-bridge";

/** Appends `Authorization: Bearer …` when a Firebase session exists. */
export async function appendFirebaseAuthHeader(headers: Headers): Promise<void> {
  if (!firebaseAuthRequired() || headers.has("Authorization")) return;

  const token = await resolveServerFnIdToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
}
