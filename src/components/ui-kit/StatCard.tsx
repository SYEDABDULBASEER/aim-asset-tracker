import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Card } from "./Card";

export function StatCard({
  label,
  value,
  icon: Icon,
  badge,
  className = "",
}: {
  label: string;
  value: ReactNode;
  icon?: LucideIcon;
  badge?: ReactNode;
  className?: string;
}) {
  return (
    <Card className={`p-5 ${className}`.trim()}>
      <div className="flex items-start justify-between gap-2">
        <div className="text-xs text-muted-foreground">{label}</div>
        {badge}
      </div>
      <div className="flex items-center gap-2 mt-2">
        {Icon ? <Icon className="h-5 w-5 text-muted-foreground shrink-0" aria-hidden /> : null}
        <div className="text-2xl font-semibold tabular-nums">{value}</div>
      </div>
    </Card>
  );
}
