// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EmptyState } from "@/components/ui-kit/EmptyState";
import { ListPageSkeleton } from "@/components/ui-kit/ListPageSkeleton";
import { formatListQueryError } from "@/lib/auth/list-query-error";

/** Mirrors admin list pattern: loading → error → empty → table */
function ListPagePreview({
  loading,
  error,
  items,
}: {
  loading?: boolean;
  error?: unknown;
  items: string[];
}) {
  if (loading) return <ListPageSkeleton />;
  if (error) {
    return (
      <div role="alert" className="text-destructive">
        {formatListQueryError(error)}
      </div>
    );
  }
  if (items.length === 0) {
    return <EmptyState title="No rows" description="Nothing matched your filters." />;
  }
  return (
    <ul>
      {items.map((id) => (
        <li key={id}>{id}</li>
      ))}
    </ul>
  );
}

describe("admin list page state machine", () => {
  it("shows skeleton while loading", () => {
    render(<ListPagePreview loading items={[]} />);
    expect(screen.getByLabelText("Loading")).toBeInTheDocument();
  });

  it("shows error banner on failure", () => {
    render(<ListPagePreview error={new Error("Sign in required.")} items={[]} />);
    expect(screen.getByRole("alert")).toHaveTextContent(
      formatListQueryError(new Error("Sign in required.")),
    );
  });

  it("shows empty state when no items", () => {
    render(<ListPagePreview items={[]} />);
    expect(screen.getByText("No rows")).toBeInTheDocument();
  });

  it("shows table rows when data exists", () => {
    render(<ListPagePreview items={["AST-1", "AST-2"]} />);
    expect(screen.getByText("AST-1")).toBeInTheDocument();
    expect(screen.getByText("AST-2")).toBeInTheDocument();
  });
});
