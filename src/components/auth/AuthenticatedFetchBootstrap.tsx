import { useEffect } from "react";
import {
  useAuthenticatedServerFetch,
  installAuthenticatedServerFetch,
} from "@/lib/auth/server-fn-client";

/** Patch `fetch` before the first paint so server functions are never issued without auth headers. */
if (typeof window !== "undefined") {
  installAuthenticatedServerFetch();
}

function patchTanStackStartFetch(): boolean {
  const win = window as Window & {
    __TSS_START_OPTIONS__?: { serverFns?: { fetch?: typeof fetch } };
  };
  const options = win.__TSS_START_OPTIONS__;
  if (!options) return false;

  void import("@/lib/auth/authenticated-fetch").then(({ authenticatedServerFnFetch }) => {
    const base = win.fetch.bind(win);
    options.serverFns = {
      ...options.serverFns,
      fetch: (input, init) => authenticatedServerFnFetch(base, input, init),
    };
  });
  return true;
}

/** Wires Firebase Bearer tokens into TanStack Start server function HTTP client. */
export function AuthenticatedFetchBootstrap() {
  useAuthenticatedServerFetch();

  useEffect(() => {
    if (patchTanStackStartFetch()) return;
    const id = window.setInterval(() => {
      if (patchTanStackStartFetch()) window.clearInterval(id);
    }, 25);
    return () => window.clearInterval(id);
  }, []);

  return null;
}
