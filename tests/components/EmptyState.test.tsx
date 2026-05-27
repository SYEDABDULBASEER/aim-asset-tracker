// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EmptyState } from "@/components/ui-kit/EmptyState";

describe("EmptyState", () => {
  it("renders title and description", () => {
    render(
      <EmptyState title="No assets" description="Add your first asset to get started." />,
    );
    expect(screen.getByText("No assets")).toBeInTheDocument();
    expect(screen.getByText(/first asset/)).toBeInTheDocument();
  });

  it("renders optional action", () => {
    render(<EmptyState title="Empty" action={<button type="button">Add</button>} />);
    expect(screen.getByRole("button", { name: "Add" })).toBeInTheDocument();
  });
});
