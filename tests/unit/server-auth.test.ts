import { describe, expect, it } from "vitest";
import { extractBearerToken } from "@/lib/auth/server";
import { isServerFnSameOriginAllowed } from "@/lib/auth/same-origin-server-fn";

describe("server auth helpers", () => {
  it("extractBearerToken parses Authorization header", () => {
    expect(extractBearerToken("Bearer abc.def")).toBe("abc.def");
    expect(extractBearerToken("bearer token")).toBe("token");
    expect(extractBearerToken(null)).toBeNull();
    expect(extractBearerToken("Basic x")).toBeNull();
  });

  it("isServerFnSameOriginAllowed allows same-origin sec-fetch-site", () => {
    const req = new Request("https://app.example/admin", {
      headers: { "sec-fetch-site": "same-origin" },
    });
    expect(isServerFnSameOriginAllowed(req, { production: true })).toBe(true);
  });

  it("isServerFnSameOriginAllowed blocks foreign origin in production", () => {
    const req = new Request("https://app.example/fn", {
      headers: { origin: "https://evil.example" },
    });
    expect(isServerFnSameOriginAllowed(req, { production: true })).toBe(false);
  });

  it("isServerFnSameOriginAllowed allows matching origin in production", () => {
    const req = new Request("https://app.example/fn", {
      headers: { origin: "https://app.example" },
    });
    expect(isServerFnSameOriginAllowed(req, { production: true })).toBe(true);
  });

  it("isServerFnSameOriginAllowed allows dev without origin when not production", () => {
    const req = new Request("http://localhost:5173/fn");
    expect(isServerFnSameOriginAllowed(req, { production: false })).toBe(true);
  });
});
