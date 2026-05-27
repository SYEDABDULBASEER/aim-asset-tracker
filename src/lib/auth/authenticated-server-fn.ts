import { authenticatedServerFnFetch } from "@/lib/auth/authenticated-fetch";
import { FIREBASE_ID_TOKEN_HEADER } from "@/lib/auth/auth-headers";
import { waitForServerFnIdToken } from "@/lib/auth/auth-token-bridge";
import {
  EMPLOYEE_PORTAL_FN_HEADER,
  EMPLOYEE_PORTAL_FN_HEADER_VALUE,
} from "@/lib/auth/employee-portal";
import { staffWorkspaceAuthRequired } from "@/lib/auth/staff-workspace-auth";
import { getNativeFetch } from "@/lib/auth/server-fn-client";

/** Same-origin unpatched fetch + Firebase Bearer (does not rely on `window.fetch` patch timing). */
function createItWorkspaceServerFnFetch(): typeof fetch {
  const native = getNativeFetch();
  return (input, init) => authenticatedServerFnFetch(native, input, init);
}

/**
 * Calls a server function for the IT workspace: always attaches the Firebase ID token when auth is
 * required. Resolves the token from the Auth singleton (not React effects) so the first request
 * after sign-in is authenticated.
 */
type ServerFnCallOptions = {
  headers?: Record<string, string>;
  fetch?: typeof fetch;
};

export async function callAuthenticatedServerFn<T>(
  serverFn: (opts?: ServerFnCallOptions) => Promise<T>,
  opts?: ServerFnCallOptions,
): Promise<T> {
  const headers: Record<string, string> = {
    ...(opts?.headers as Record<string, string> | undefined),
  };

  if (typeof window !== "undefined" && staffWorkspaceAuthRequired() && !headers.Authorization) {
    const token = await waitForServerFnIdToken(80);
    if (token) {
      const bearer = `Bearer ${token}`;
      headers.Authorization = bearer;
      headers[FIREBASE_ID_TOKEN_HEADER] = bearer;
    }
  }

  return serverFn({
    ...opts,
    headers,
    fetch: createItWorkspaceServerFnFetch(),
  });
}

/**
 * Employee support portal: no Firebase account. Uses native fetch (no Bearer) + portal header so
 * the server runs ticket handlers under a synthetic guest context (same-origin only).
 */
export async function callEmployeePortalServerFn<T>(
  serverFn: (opts?: ServerFnCallOptions) => Promise<T>,
  opts?: ServerFnCallOptions,
): Promise<T> {
  const headers = {
    ...(opts?.headers as Record<string, string> | undefined),
    [EMPLOYEE_PORTAL_FN_HEADER]: EMPLOYEE_PORTAL_FN_HEADER_VALUE,
  };
  return serverFn({
    ...opts,
    headers,
    fetch: getNativeFetch(),
  });
}
