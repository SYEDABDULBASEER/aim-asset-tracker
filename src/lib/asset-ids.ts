import type { AssetCategory } from "@/lib/models";

export const ASSET_ID_PREFIX_BY_CATEGORY: Record<AssetCategory, string> = {
  Laptop: "LAP",
  Monitor: "MON",
  Printer: "PRT",
  Mobile: "MOB",
  Network: "NET",
  Desktop: "PC",
  Accessory: "ACC",
};

const ASSET_ID_PATTERN = /^([A-Z]{2,4})-(\d+)$/;

export function parseAssetIdSequence(id: string, prefix: string): number | null {
  const match = id.trim().toUpperCase().match(ASSET_ID_PATTERN);
  if (!match || match[1] !== prefix.toUpperCase()) return null;
  const value = Number.parseInt(match[2], 10);
  return Number.isFinite(value) ? value : null;
}

export function formatAssetId(prefix: string, sequence: number): string {
  return `${prefix.toUpperCase()}-${String(sequence).padStart(4, "0")}`;
}

export function nextAssetIdForCategory(
  category: AssetCategory,
  existingIds: Iterable<string>,
): string {
  const prefix = ASSET_ID_PREFIX_BY_CATEGORY[category];
  let max = 0;
  for (const id of existingIds) {
    const sequence = parseAssetIdSequence(id, prefix);
    if (sequence !== null && sequence > max) max = sequence;
  }
  return formatAssetId(prefix, max + 1);
}
