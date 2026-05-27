import type { HTMLAttributes, ReactNode, TableHTMLAttributes } from "react";
import { Card } from "./Card";

/** Standard admin table shell: Card + horizontal scroll on narrow viewports. */
export function TableCard({
  children,
  className = "",
  scrollLabel = "Table data",
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  /** Accessible name for the scroll region (screen readers). */
  scrollLabel?: string;
}) {
  return (
    <Card className={`overflow-hidden ${className}`.trim()} {...props}>
      <div
        className="overflow-x-auto overscroll-x-contain -webkit-overflow-scrolling-touch"
        role="region"
        aria-label={scrollLabel}
        tabIndex={0}
      >
        <div className="min-w-[640px]">{children}</div>
      </div>
    </Card>
  );
}

export function AdminTable({
  children,
  className = "w-full text-sm",
  ...props
}: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <table className={className} {...props}>
      {children}
    </table>
  );
}

export function AdminTableHead({ children }: { children: ReactNode }) {
  return <thead className="bg-muted/50">{children}</thead>;
}

export function AdminTableHeadRow({ children }: { children: ReactNode }) {
  return <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">{children}</tr>;
}

export function AdminTableHeadCell({
  children,
  className = "",
}: {
  children?: ReactNode;
  className?: string;
}) {
  return <th className={`text-left font-medium px-4 py-3 ${className}`.trim()}>{children}</th>;
}

export function AdminTableBody({ children }: { children: ReactNode }) {
  return <tbody>{children}</tbody>;
}

export function AdminTableRow({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <tr className={`border-t border-border hover:bg-muted/30 transition ${className}`.trim()}>
      {children}
    </tr>
  );
}

export function AdminTableCell({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <td className={`px-4 py-3 ${className}`.trim()}>{children}</td>;
}
