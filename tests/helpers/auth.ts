import type { AppRole } from "@/lib/auth/roles";
import { runWithRequestContext, type ServerAuthContext } from "@/lib/auth/request-context";

export function testAuth(overrides: Partial<ServerAuthContext> & { role: AppRole }): ServerAuthContext {
  return {
    uid: overrides.uid ?? "test-uid",
    email: overrides.email ?? "test@example.com",
    role: overrides.role,
  };
}

export function withAuth<T>(role: AppRole, fn: () => T): T {
  return runWithRequestContext({ auth: testAuth({ role }) }, fn);
}

export function withAuthAsync<T>(role: AppRole, fn: () => Promise<T>): Promise<T> {
  return runWithRequestContext({ auth: testAuth({ role }) }, fn);
}
