import { describe, expect, it } from "vitest";
import {
  formatAssetsQueryError,
  formatListQueryError,
  isAuthListQueryError,
} from "@/lib/auth/list-query-error";

describe("list-query-error", () => {
  it("detects auth-related errors", () => {
    expect(isAuthListQueryError(new Error("Sign in required."))).toBe(true);
    expect(isAuthListQueryError(new Error("Invalid or expired session"))).toBe(true);
    expect(isAuthListQueryError(new Error("HTTP (401)"))).toBe(true);
    expect(isAuthListQueryError(new Error("Server error"))).toBe(false);
  });

  it("formats auth errors for banners", () => {
    expect(formatListQueryError(new Error("Sign in required."))).toContain("IT login");
    expect(formatListQueryError(new Error("Invalid or expired session"))).toContain("expired");
  });

  it("formats forbidden errors", () => {
    expect(formatListQueryError(new Error("Forbidden (403)"))).toContain("permission");
  });

  it("formats HTML error pages", () => {
    expect(formatListQueryError(new Error("<!doctype html><html>"))).toContain("unexpected error");
  });

  it("formats assets enum migration message", () => {
    const msg = formatAssetsQueryError(new Error('invalid_enum_value: "Servers"'));
    expect(msg).toContain("Servers");
    expect(msg).toContain("Desktop");
  });
});
