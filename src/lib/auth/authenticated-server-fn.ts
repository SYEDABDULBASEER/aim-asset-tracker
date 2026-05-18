import { firebaseAuthRequired } from "@/lib/firebase/env";
import { resolveServerFnIdToken } from "@/lib/auth/auth-token-bridge";

export type ServerFnCallOptions = {
  data?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  fetch?: typeof fetch;
};

/** Firebase Bearer token for TanStack server function `headers` option. */
export async function getServerFnAuthHeaders(): Promise<Record<string, string> | undefined> {
  if (!firebaseAuthRequired()) return undefined;

  const token = await resolveServerFnIdToken();
  if (!token) return undefined;

  return { Authorization: `Bearer ${token}` };
}

/**
 * Call a server function with the current user's Firebase ID token.
 * This is the supported TanStack Start path (`opts.headers`) — do not rely on fetch patching alone.
 */
export async function callAuthenticatedServerFn<T>(
  serverFn: (opts?: ServerFnCallOptions) => Promise<T>,
  opts?: Omit<ServerFnCallOptions, "headers">,
): Promise<T> {
  const authHeaders = await getServerFnAuthHeaders();

  if (firebaseAuthRequired() && !authHeaders) {
    throw new Error("Authentication required. Sign out and sign in again at /login.");
  }

  return serverFn({
    ...opts,
    headers: { ...authHeaders, ...opts?.headers },
  });
}
