import { Link } from "@tanstack/react-router";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";

/** Shown on allocation/maintenance when filtered by `?assetId=`. */
export function AssetContextBanner({
  assetId,
  assetLabel,
  onClear,
}: {
  assetId: string;
  /** Optional asset name shown beside the ID. */
  assetLabel?: string | null;
  onClear: () => void;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
      <span className="text-muted-foreground min-w-0">
        Showing records for{" "}
        <Link
          to="/admin/assets/$id"
          params={{ id: assetId }}
          search={{ q: undefined }}
          className="font-mono font-medium text-primary hover:underline"
        >
          {assetId}
        </Link>
        {assetLabel ? (
          <span className="text-foreground font-medium"> · {assetLabel}</span>
        ) : null}
      </span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 ml-auto shrink-0"
        onClick={onClear}
      >
        <X className="h-3.5 w-3.5 mr-1" />
        Clear filter
      </Button>
    </div>
  );
}
