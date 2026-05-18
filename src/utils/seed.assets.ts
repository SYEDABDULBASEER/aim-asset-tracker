import type { Asset } from "@/lib/models";
import { buildBook1Assets } from "./seed.book1.assets";

/** Inventory seeded from Book1.xlsx (see scripts/generate_book1_asset_ids.py). */
export function buildSeedAssets(): Asset[] {
  return buildBook1Assets();
}
