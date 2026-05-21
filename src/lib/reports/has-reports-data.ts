import type { ReportsSummary } from "@/utils/reports.functions";

export function reportsHasExportableData(data: ReportsSummary | undefined): boolean {
  if (!data) return false;
  return (
    data.depreciationCurve.some((point) => point.value > 0) ||
    data.departmentUsage.some((point) => point.value > 0) ||
    data.vendorPerformance.length > 0 ||
    data.lifecycleHeatmap.some((cell) => cell.intensity > 0) ||
    data.kpis.openTickets > 0 ||
    (data.kpis.avgResolutionHours ?? 0) > 0
  );
}
