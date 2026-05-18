import type { MaintenanceJob } from "@/lib/models";

export function buildSeedMaintenanceJobs(): MaintenanceJob[] {
  return [
    {
      id: "MNT-220",
      assetId: "LAP-0001",
      type: "Preventive",
      vendor: "TechCare Services",
      scheduledAt: "2026-05-12T10:00:00.000Z",
      status: "Scheduled",
      notes: null,
    },
    {
      id: "MNT-219",
      assetId: "PC-0012",
      type: "Repair",
      vendor: "PrintWorks Co.",
      scheduledAt: "2026-05-08T13:00:00.000Z",
      status: "In Progress",
      notes: "Paper jam sensor replacement",
    },
    {
      id: "MNT-218",
      assetId: "PC-0013",
      type: "Preventive",
      vendor: "NetSecure Ltd.",
      scheduledAt: "2026-05-02T09:30:00.000Z",
      status: "Completed",
      notes: null,
    },
    {
      id: "MNT-217",
      assetId: "MON-0002",
      type: "Repair",
      vendor: "Cloud9 Hardware",
      scheduledAt: "2026-04-28T15:00:00.000Z",
      status: "Completed",
      notes: null,
    },
  ];
}
