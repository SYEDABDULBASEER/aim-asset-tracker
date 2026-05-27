// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ListPageSkeleton } from "@/components/ui-kit/ListPageSkeleton";

describe("ListPageSkeleton", () => {
  it("exposes loading semantics", () => {
    render(<ListPageSkeleton rows={3} columns={4} />);
    const region = screen.getByLabelText("Loading");
    expect(region).toHaveAttribute("aria-busy", "true");
  });
});
