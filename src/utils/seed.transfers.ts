import type { Transfer } from "@/lib/models";
import { EMPLOYEE_ROSTER, pcNoToAssetId } from "./seed.employee-roster";

export function buildSeedTransfers(): Transfer[] {
  const now = "2026-05-21T10:00:00.000Z";
  const out: Transfer[] = [];
  EMPLOYEE_ROSTER.forEach((row, index) => {
    if (!row.pcNo) return;
    const assetId = pcNoToAssetId(row.pcNo);
    if (!assetId) return;
    out.push({
      id: `TRF-${String(out.length + 1).padStart(3, "0")}`,
      assetId,
      fromParty: "IT Stock",
      toParty: row.name,
      fromEmployeeId: null,
      toEmployeeId: `EMP-${String(index + 1).padStart(3, "0")}`,
      status: "Approved",
      requestedAt: now,
      notes: "Current desk assignment",
    });
  });
  return out;
}
