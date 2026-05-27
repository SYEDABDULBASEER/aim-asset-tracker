// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AuthStatusBanner } from "@/components/auth/AuthStatusBanner";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}));

describe("AuthStatusBanner", () => {
  it("shows sign-in link for auth errors", () => {
    render(<AuthStatusBanner error={new Error("Sign in required.")} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Sign in required");
    expect(screen.getByRole("link", { name: /sign in again/i })).toHaveAttribute("href", "/login");
  });

  it("shows retry for non-auth errors", () => {
    const onRetry = vi.fn();
    render(<AuthStatusBanner error={new Error("Server error")} onRetry={onRetry} />);
    screen.getByRole("button", { name: /retry/i }).click();
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
