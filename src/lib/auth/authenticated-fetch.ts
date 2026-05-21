import { staffWorkspaceAuthRequired } from "@/lib/auth/staff-workspace-auth";
import { appendFirebaseAuthHeader } from "@/lib/auth/firebase-auth-header";

function errorMessageFromResponseBody(body: string, status: number): string {
  const trimmed = body.trim();
  if (!trimmed) return `Request failed (${status})`;
  try {
    const json = JSON.parse(trimmed) as { message?: unknown };
    if (typeof json.message === "string" && json.message.trim()) {
      return json.message;
    }
  } catch {
    /* plain text */
  }
  return trimmed.length > 200 ? `${trimmed.slice(0, 200)}…` : trimmed;
}

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

  if (staffWorkspaceAuthRequired()) {
    try {
      await appendFirebaseAuthHeader(headers);
    } catch (error) {
      console.warn("authenticatedServerFnFetch: could not attach token", error);
    }
  }

  const response =
    input instanceof Request
      ? await fetchImpl(new Request(input, { ...init, headers }))
      : await fetchImpl(input, { ...init, headers });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(errorMessageFromResponseBody(body, response.status));
  }

  return response;
}
