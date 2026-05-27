import type { HTMLAttributes, ReactNode } from "react";

export type PageShellVariant = "wide" | "narrow" | "portal" | "full";

const variantClass: Record<PageShellVariant, string> = {
  /** Admin list/detail pages (assets, tickets, etc.) */
  wide: "max-w-[1600px]",
  /**
   * Settings and form-heavy pages — narrower column keeps long forms and audit
   * tables readable without excessive line length on ultra-wide monitors.
   */
  narrow: "max-w-[1100px]",
  /** Employee portal */
  portal: "max-w-3xl",
  full: "max-w-none",
};

export function PageShell({
  variant = "wide",
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  variant?: PageShellVariant;
  children: ReactNode;
}) {
  return (
    <div className={`p-8 mx-auto w-full ${variantClass[variant]} ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}
