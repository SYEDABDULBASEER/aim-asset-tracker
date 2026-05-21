import { useEffect } from "react";
import { staffWorkspaceAuthRequired } from "@/lib/auth/staff-workspace-auth";

const PATCHED = Symbol.for("assetdesk.authFetchPatched");

let nativeFetch: typeof fetch =
  typeof window !== "undefined" ? window.fetch.bind(window) : fetch;

/** Unpatched fetch — use for server function HTTP after adding auth headers. */
export function getNativeFetch(): typeof fetch {
  return nativeFetch;
}

/** Patch global fetch so server functions include the Firebase Bearer token. */
export function installAuthenticatedServerFetch(): void {
  if (typeof window === "undefined") return;
  if (!staffWorkspaceAuthRequired()) return;

  const globalRef = window as Window & { [PATCHED]?: boolean };
  if (globalRef[PATCHED]) return;

  nativeFetch = window.fetch.bind(window);

  window.fetch = async (input, init) => {
    const headers = new Headers(init?.headers);
    if (input instanceof Request) {
      input.headers.forEach((value, key) => {
        if (!headers.has(key)) headers.set(key, value);
      });
    }

    const isServerFn =
      headers.get("x-tsr-serverFn") === "true" || headers.get("X-Tsr-ServerFn") === "true";

    if (isServerFn) {
      const { authenticatedServerFnFetch } = await import("@/lib/auth/authenticated-fetch");
      return authenticatedServerFnFetch(nativeFetch, input, init);
    }

    return nativeFetch(input, init);
  };

  globalRef[PATCHED] = true;
}

export function useAuthenticatedServerFetch() {
  useEffect(() => {
    installAuthenticatedServerFetch();
    void import("@/lib/auth/ensure-start-auth-client").then((m) => m.ensureStartAuthClient());
  }, []);
}
