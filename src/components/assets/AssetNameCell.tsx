import { useState } from "react";
import type { Asset } from "@/lib/models";
import { getAssetSpecificationLines } from "@/lib/book1-inventory";

type AssetNameCellProps = {
  asset: Asset;
};

export function AssetNameCell({ asset }: AssetNameCellProps) {
  const specLines = getAssetSpecificationLines(asset);
  const [open, setOpen] = useState(false);

  if (specLines.length === 0) {
    return <span>{asset.name}</span>;
  }

  return (
    <div className="min-w-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="text-left font-medium text-foreground hover:text-primary transition"
      >
        {asset.name}
      </button>
      {open ? (
        <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
          {specLines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
