import { createServerFn } from "@tanstack/react-start";
import { requireRead } from "@/lib/auth/require-auth";
import { loadAllAssets } from "./assets-source.server";
import { loadAllTickets } from "./tickets-source.server";
import { loadAllVendors } from "./vendors-source.server";
import { loadAllMaintenanceJobs } from "./maintenance-source.server";

function isTerminalTicketStatus(status: string): boolean {
  return status === "Resolved" || status === "Closed";
}

const DEPRECIATION_MONTHS = 36;

function remainingBookValuePercent(purchaseDate: string, asOf: Date): number | null {
  const purchased = new Date(purchaseDate);
  if (Number.isNaN(purchased.getTime())) return null;
  const ageMonths =
    (asOf.getFullYear() - purchased.getFullYear()) * 12 + (asOf.getMonth() - purchased.getMonth());
  if (ageMonths < 0) return 100;
  return Math.max(0, Math.round((1 - ageMonths / DEPRECIATION_MONTHS) * 100));
}

export type ReportsSummary = {
  kpis: {
    avgResolutionHours: number | null;
    firstResponseMinutes: number | null;
    openTickets: number;
    vendorSlaPercent: number | null;
  };
  depreciationCurve: Array<{ month: string; value: number }>;
  departmentUsage: Array<{ name: string; value: number }>;
  vendorPerformance: Array<{ name: string; slaPercent: number }>;
  lifecycleHeatmap: Array<{ week: number; intensity: number }>;
  slaAdherencePercent: number;
};

async function buildReportsSummary(): Promise<ReportsSummary> {
  const [assets, tickets, vendors, maintenanceJobs] = await Promise.all([
    loadAllAssets(),
    loadAllTickets(),
    loadAllVendors(),
    loadAllMaintenanceJobs(),
  ]);

  const terminal = tickets.filter((t) => isTerminalTicketStatus(t.status));
  const resolutionHours = terminal
    .map((t) => {
      const start = new Date(t.createdAt).getTime();
      const end = new Date(t.updatedAt).getTime();
      if (Number.isNaN(start) || Number.isNaN(end) || end < start) return null;
      return (end - start) / (1000 * 60 * 60);
    })
    .filter((v): v is number => v !== null);
  const avgResolutionHours =
    resolutionHours.length > 0
      ? Math.round((resolutionHours.reduce((a, b) => a + b, 0) / resolutionHours.length) * 10) / 10
      : null;

  const responseMinutes = tickets
    .filter((t) => t.messages.length > 0)
    .map((t) => {
      const first = t.messages[0];
      if (!first) return null;
      const start = new Date(t.createdAt).getTime();
      const end = new Date(first.createdAt).getTime();
      if (Number.isNaN(start) || Number.isNaN(end) || end < start) return null;
      return (end - start) / (1000 * 60);
    })
    .filter((v): v is number => v !== null);
  const firstResponseMinutes =
    responseMinutes.length > 0
      ? Math.round(responseMinutes.reduce((a, b) => a + b, 0) / responseMinutes.length)
      : null;

  const openTickets = tickets.filter((t) => !isTerminalTicketStatus(t.status)).length;
  const vendorSlaPercent =
    vendors.length > 0
      ? Math.round((vendors.reduce((sum, v) => sum + v.slaPercent, 0) / vendors.length) * 10) / 10
      : null;

  const monthLabels = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const year = new Date().getFullYear();
  const depreciableAssets = assets.filter((asset) => asset.purchaseDate);
  const depreciationCurve = monthLabels.map((month, index) => {
    const asOf = new Date(year, index + 1, 0);
    if (depreciableAssets.length === 0) {
      return { month, value: 0 };
    }
    const values = depreciableAssets
      .map((asset) => remainingBookValuePercent(asset.purchaseDate!, asOf))
      .filter((value): value is number => value !== null);
    const value =
      values.length > 0
        ? Math.round(values.reduce((sum, current) => sum + current, 0) / values.length)
        : 0;
    return { month, value };
  });

  const byDepartment = new Map<string, number>();
  for (const asset of assets) {
    const dept = asset.department ?? "Unassigned";
    byDepartment.set(dept, (byDepartment.get(dept) ?? 0) + 1);
  }
  const departmentUsage = Array.from(byDepartment.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const vendorPerformance = vendors
    .map((v) => ({ name: v.name, slaPercent: v.slaPercent }))
    .sort((a, b) => b.slaPercent - a.slaPercent);

  const now = new Date();
  const lifecycleHeatmap = Array.from({ length: 84 }, (_, week) => {
    const bucket = maintenanceJobs.filter((job) => {
      const scheduled = new Date(job.scheduledAt);
      if (Number.isNaN(scheduled.getTime())) return false;
      const diffWeeks = Math.floor(
        (now.getTime() - scheduled.getTime()) / (7 * 24 * 60 * 60 * 1000),
      );
      return diffWeeks === week;
    }).length;
    const intensity = assets.length > 0 ? Math.min(1, bucket / Math.max(1, assets.length / 12)) : 0;
    return { week: week + 1, intensity };
  });

  const nowMs = now.getTime();
  const slaMet = tickets.filter((t) => {
    if (!t.slaDueAt) return true;
    if (isTerminalTicketStatus(t.status)) {
      return new Date(t.updatedAt).getTime() <= new Date(t.slaDueAt).getTime();
    }
    return new Date(t.slaDueAt).getTime() >= nowMs;
  }).length;
  const slaAdherencePercent =
    tickets.length > 0 ? Math.round((slaMet / tickets.length) * 1000) / 10 : 100;

  return {
    kpis: {
      avgResolutionHours,
      firstResponseMinutes,
      openTickets,
      vendorSlaPercent,
    },
    depreciationCurve,
    departmentUsage,
    vendorPerformance,
    lifecycleHeatmap,
    slaAdherencePercent,
  };
}

export const getReportsSummary = createServerFn({ method: "GET" }).handler(async () => {
  requireRead("reports");
  return buildReportsSummary();
});

export const exportReportsCsv = createServerFn({ method: "GET" }).handler(async () => {
  requireRead("reports");
  const summary = await buildReportsSummary();
  const lines = [
    "metric,value",
    `avg_resolution_hours,${summary.kpis.avgResolutionHours ?? ""}`,
    `first_response_minutes,${summary.kpis.firstResponseMinutes ?? ""}`,
    `open_tickets,${summary.kpis.openTickets}`,
    `vendor_sla_percent,${summary.kpis.vendorSlaPercent ?? ""}`,
    `sla_adherence_percent,${summary.slaAdherencePercent}`,
    "",
    "department,asset_count",
    ...summary.departmentUsage.map((row) => `${row.name},${row.value}`),
    "",
    "vendor,sla_percent",
    ...summary.vendorPerformance.map((row) => `${row.name},${row.slaPercent}`),
  ];
  return { csv: lines.join("\n"), filename: "asset-desk-reports.csv" };
});
