import { describe, expect, it } from "vitest";
import { reportsHasExportableData } from "@/lib/reports/has-reports-data";
import type { ReportsSummary } from "@/utils/reports.functions";

function emptySummary(): ReportsSummary {
  return {
    kpis: {
      openTickets: 0,
      avgResolutionHours: null,
      firstResponseMinutes: null,
      vendorSlaPercent: null,
    },
    depreciationCurve: [{ month: "Jan", value: 0 }],
    departmentUsage: [{ name: "IT", value: 0 }],
    vendorPerformance: [],
    lifecycleHeatmap: [{ week: 1, intensity: 0 }],
    slaAdherencePercent: 0,
  };
}

describe("reportsHasExportableData", () => {
  it("returns false for empty summary", () => {
    expect(reportsHasExportableData(undefined)).toBe(false);
    expect(reportsHasExportableData(emptySummary())).toBe(false);
  });

  it("returns true when any series has data", () => {
    const summary = emptySummary();
    summary.kpis.openTickets = 2;
    expect(reportsHasExportableData(summary)).toBe(true);
  });
});
