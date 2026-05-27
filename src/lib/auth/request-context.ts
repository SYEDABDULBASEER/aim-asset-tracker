import { AsyncLocalStorage } from "node:async_hooks";
import type { AppRole } from "./roles";

export type ServerAuthContext = {
  uid: string;
  email: string | null;
  role: AppRole;
};

export type RequestContext = {
  auth: ServerAuthContext | null;
};

const STORAGE_SYMBOL = Symbol.for("assetdesk.requestContextStorage");
const FALLBACK_SYMBOL = Symbol.for("assetdesk.requestContextFallback");

type RequestContextGlobal = typeof globalThis & {
  [STORAGE_SYMBOL]?: AsyncLocalStorage<RequestContext>;
  [FALLBACK_SYMBOL]?: RequestContext | null;
};

const storage: AsyncLocalStorage<RequestContext> = (() => {
  const g = globalThis as RequestContextGlobal;
  if (!g[STORAGE_SYMBOL]) {
    g[STORAGE_SYMBOL] = new AsyncLocalStorage<RequestContext>();
  }
  return g[STORAGE_SYMBOL];
})();

/**
 * Global fallback for when AsyncLocalStorage context is lost across
 * TanStack Start's internal dispatch boundary.
 * This is safe for single-request-at-a-time dev servers.
 */
function getFallbackContext(): RequestContext | null {
  return (globalThis as RequestContextGlobal)[FALLBACK_SYMBOL] ?? null;
}

function setFallbackContext(ctx: RequestContext | null): void {
  (globalThis as RequestContextGlobal)[FALLBACK_SYMBOL] = ctx;
}

export function runWithRequestContext<T>(context: RequestContext, fn: () => T): T {
  setFallbackContext(context);
  return storage.run(context, fn);
}

export function getRequestContext(): RequestContext | undefined {
  return storage.getStore() ?? getFallbackContext() ?? undefined;
}

export function getServerAuth(): ServerAuthContext | null {
  const ctx = storage.getStore() ?? getFallbackContext();
  return ctx?.auth ?? null;
}
