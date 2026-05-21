import type { Asset } from "@/lib/models";

/** Split workbook `specifications` (Accessories / Softwares) for display. */
export function parseBook1Specifications(specifications: string): string[] {
  return specifications
    .split(";")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function getAssetSpecificationLines(asset: Pick<Asset, "specifications">): string[] {
  if (!asset.specifications?.trim()) return [];
  return parseBook1Specifications(asset.specifications);
}
