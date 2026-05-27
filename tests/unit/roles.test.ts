import { describe, expect, it } from "vitest";
import {
  canRead,
  canWrite,
  formatAppRoleLabel,
  isEndUserRole,
  isStaffRole,
  normalizeAppRole,
  PERMISSION_DOMAINS,
} from "@/lib/auth/roles";

describe("roles", () => {
  it("normalizeAppRole falls back to admin for unknown values", () => {
    expect(normalizeAppRole("bogus")).toBe("admin");
    expect(normalizeAppRole("viewer")).toBe("viewer");
  });

  it("admin can read and write all domains", () => {
    for (const domain of PERMISSION_DOMAINS) {
      expect(canRead("admin", domain)).toBe(true);
      expect(canWrite("admin", domain)).toBe(true);
    }
  });

  it("viewer can read operational domains but not write", () => {
    expect(canRead("viewer", "assets")).toBe(true);
    expect(canWrite("viewer", "assets")).toBe(false);
    expect(canRead("viewer", "settings")).toBe(false);
    expect(canWrite("viewer", "seed")).toBe(false);
  });

  it("agent can write tickets and assets but not settings", () => {
    expect(canWrite("agent", "tickets")).toBe(true);
    expect(canWrite("agent", "settings")).toBe(false);
    expect(canRead("agent", "employees")).toBe(true);
  });

  it("user role is end-user only", () => {
    expect(isEndUserRole("user")).toBe(true);
    expect(isStaffRole("user")).toBe(false);
    expect(canRead("user", "assets")).toBe(false);
  });

  it("formatAppRoleLabel returns display strings", () => {
    expect(formatAppRoleLabel("admin")).toBe("Admin");
    expect(formatAppRoleLabel("agent")).toBe("Agent");
  });
});
