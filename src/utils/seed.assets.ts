import type { Asset } from "@/lib/models";
import { buildAssetsData2025 } from "./seed.assets-data-2025";
import {
  applyEmployeeRosterToAssets,
  buildRosterExtraAssets,
} from "./seed.employee-roster";

/** Inventory from Assets Data 2025.xlsx + roster desk assignments. */
export function buildSeedAssets(): Asset[] {
  return applyEmployeeRosterToAssets([...buildAssetsData2025(), ...buildRosterExtraAssets()]);
}
