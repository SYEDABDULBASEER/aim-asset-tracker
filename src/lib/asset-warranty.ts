import type { Asset } from "@/lib/models";
import type { WarrantyBand } from "@/lib/models";

const EXPIRING_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

export function getWarrantyBand(asset: Pick<Asset, "warrantyUntil">, now = new Date()): WarrantyBand {
  if (!asset.warrantyUntil) return "unknown";
  const until = new Date(asset.warrantyUntil);
  if (Number.isNaN(until.getTime())) return "unknown";
  const nowMs = now.getTime();
  if (until.getTime() < nowMs) return "expired";
  if (until.getTime() - nowMs <= EXPIRING_WINDOW_MS) return "expiring";
  return "active";
}

export function matchesWarrantyBand(
  asset: Pick<Asset, "warrantyUntil">,
  band: WarrantyBand,
  now = new Date(),
): boolean {
  return getWarrantyBand(asset, now) === band;
}
