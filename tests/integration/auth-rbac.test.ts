import { describe, expect, it, vi, afterEach } from "vitest";
import { AuthError, requireRead, requireRole, requireWrite } from "@/lib/auth/require-auth";
import * as firebaseEnv from "@/lib/firebase/env";
import { withAuth } from "../helpers/auth";

describe("auth RBAC with firebase required", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("viewer cannot write assets when firebase auth is required", () => {
    vi.spyOn(firebaseEnv, "isFirebaseConfigured").mockReturnValue(true);
    vi.spyOn(firebaseEnv, "firebaseAuthRequired").mockReturnValue(true);

    expect(() => withAuth("viewer", () => requireWrite("assets"))).toThrow(AuthError);
    try {
      withAuth("viewer", () => requireWrite("assets"));
    } catch (e) {
      expect((e as AuthError).statusCode).toBe(403);
    }
  });

  it("viewer can read assets when firebase auth is required", () => {
    vi.spyOn(firebaseEnv, "isFirebaseConfigured").mockReturnValue(true);
    vi.spyOn(firebaseEnv, "firebaseAuthRequired").mockReturnValue(true);

    expect(() => withAuth("viewer", () => requireRead("assets"))).not.toThrow();
  });

  it("requireRead throws without auth context when firebase required", () => {
    vi.spyOn(firebaseEnv, "isFirebaseConfigured").mockReturnValue(true);
    vi.spyOn(firebaseEnv, "firebaseAuthRequired").mockReturnValue(true);

    expect(() => requireRead("assets")).toThrow(AuthError);
  });

  it("delete requires admin role when firebase required", () => {
    vi.spyOn(firebaseEnv, "isFirebaseConfigured").mockReturnValue(true);
    vi.spyOn(firebaseEnv, "firebaseAuthRequired").mockReturnValue(true);

    expect(() => withAuth("agent", () => requireRole("admin"))).toThrow(AuthError);
    expect(() => withAuth("admin", () => requireRole("admin"))).not.toThrow();
  });
});
