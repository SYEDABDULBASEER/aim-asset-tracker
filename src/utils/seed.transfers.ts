import type { Transfer } from "@/lib/models";

export function buildSeedTransfers(): Transfer[] {
  return [
    {
      id: "TRF-001",
      assetId: "LAP-0001",
      fromParty: "IT Stock",
      toParty: "Ahmed Khan",
      status: "Approved",
      requestedAt: "2026-05-06T09:00:00.000Z",
      notes: null,
    },
    {
      id: "TRF-002",
      assetId: "MON-0001",
      fromParty: "IT Stock",
      toParty: "Sarah Ali",
      status: "Approved",
      requestedAt: "2026-05-05T11:30:00.000Z",
      notes: null,
    },
    {
      id: "TRF-003",
      assetId: "PC-0006",
      fromParty: "Mohammed Faisal",
      toParty: "David Mathew",
      status: "Pending",
      requestedAt: "2026-05-04T14:15:00.000Z",
      notes: "Pending manager approval",
    },
    {
      id: "TRF-004",
      assetId: "PC-0010",
      fromParty: "HR",
      toParty: "Finance",
      status: "Approved",
      requestedAt: "2026-05-02T08:45:00.000Z",
      notes: null,
    },
    {
      id: "TRF-005",
      assetId: "LAP-0001",
      fromParty: "Stock",
      toParty: "Priya Sharma",
      status: "Rejected",
      requestedAt: "2026-04-30T16:20:00.000Z",
      notes: "Budget hold",
    },
  ];
}
