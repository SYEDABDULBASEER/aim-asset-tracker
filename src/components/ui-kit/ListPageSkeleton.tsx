import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "./Card";

export function ListPageSkeleton({
  rows = 8,
  columns = 5,
  className = "",
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <Card className={`overflow-hidden p-4 ${className}`.trim()} aria-busy="true" aria-label="Loading">
      <div className="space-y-3">
        <div className="flex gap-3 pb-2 border-b border-border">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={`head-${i}`} className="h-4 flex-1" />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, row) => (
          <div key={`row-${row}`} className="flex gap-3">
            {Array.from({ length: columns }).map((_, col) => (
              <Skeleton key={`cell-${row}-${col}`} className="h-8 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </Card>
  );
}
