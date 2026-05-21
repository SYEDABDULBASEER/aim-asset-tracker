import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className = "",
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center px-6 py-12 ${className}`.trim()}
    >
      <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mb-4">
        <Icon className="h-6 w-6 text-muted-foreground" aria-hidden />
      </div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description ? (
        <p className="text-sm text-muted-foreground mt-1 max-w-sm leading-relaxed">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
