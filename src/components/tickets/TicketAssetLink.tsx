import { Link } from "@tanstack/react-router";
import type { MouseEvent } from "react";

export function TicketAssetLink({
  assetId,
  className = "font-mono text-xs text-primary bg-primary/5 px-2 py-0.5 border border-primary/10 rounded hover:underline inline-block",
  onClick,
}: {
  assetId: string;
  className?: string;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
}) {
  return (
    <Link
      to="/admin/assets/$id"
      params={{ id: assetId }}
      search={{ q: undefined }}
      preload="intent"
      className={className}
      onClick={onClick}
    >
      {assetId}
    </Link>
  );
}
