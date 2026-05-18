import { firebaseAuthRequired } from "@/lib/firebase/env";
import { appendFirebaseAuthHeader } from "@/lib/auth/firebase-auth-header";

function mergeHeaders(input: RequestInfo | URL, init?: RequestInit): Headers {
  const headers = new Headers(init?.headers);
  if (input instanceof Request) {
    input.headers.forEach((value, key) => {
      if (!headers.has(key)) headers.set(key, value);
    });
  }
  return headers;
}

/**
 * Attaches Firebase ID token to server function calls.
 * Must use `fetchImpl` (native fetch) — not patched `window.fetch` — to avoid infinite recursion.
 */
export async function authenticatedServerFnFetch(
  fetchImpl: typeof fetch,
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const headers = mergeHeaders(input, init);

  if (firebaseAuthRequired()) {
    try {
      await appendFirebaseAuthHeader(headers);
    } catch (error) {
      console.warn("authenticatedServerFnFetch: could not attach token", error);
    }
  }

  if (input instanceof Request) {
    return fetchImpl(new Request(input, { ...init, headers }));
  }

  return fetchImpl(input, { ...init, headers });
}
