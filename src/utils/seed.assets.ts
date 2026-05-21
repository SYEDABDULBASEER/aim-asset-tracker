import type { Asset } from "@/lib/models";
import { buildAssetsData2025 } from "./seed.assets-data-2025";

/** Inventory from Assets Data 2025.xlsx (PCs and Specifications). */
export function buildSeedAssets(): Asset[] {
  return buildAssetsData2025();
}
