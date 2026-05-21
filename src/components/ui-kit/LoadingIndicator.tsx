import { Loader2 } from "lucide-react";

/** Accessible inline loading state for lists, sheets, and forms. */
export function LoadingIndicator({
  label,
  className = "",
  size = "md",
}: {
  label: string;
  className?: string;
  size?: "sm" | "md";
}) {
  const iconClass = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const textClass = size === "sm" ? "text-sm" : "text-sm font-medium";

  return (
    <div
      className={`flex items-center justify-center gap-2 text-muted-foreground py-8 ${className}`.trim()}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label}
    >
      <Loader2 className={`${iconClass} animate-spin text-primary shrink-0`} aria-hidden />
      <span className={textClass}>{label}</span>
    </div>
  );
}
