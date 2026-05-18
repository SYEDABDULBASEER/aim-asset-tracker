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

const storage = new AsyncLocalStorage<RequestContext>();

export function runWithRequestContext<T>(context: RequestContext, fn: () => T): T {
  return storage.run(context, fn);
}

export function getRequestContext(): RequestContext | undefined {
  return storage.getStore();
}

export function getServerAuth(): ServerAuthContext | null {
  return storage.getStore()?.auth ?? null;
}
