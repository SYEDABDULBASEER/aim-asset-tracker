import { createFileRoute } from "@tanstack/react-router";
import { Card, PageHeader } from "@/components/ui-kit/Card";
import { EmptyState } from "@/components/ui-kit/EmptyState";
import { PageShell } from "@/components/ui-kit/PageShell";
import { StatCard } from "@/components/ui-kit/StatCard";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from "recharts";
import { BarChart3, Download, TrendingDown } from "lucide-react";
import { useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuthQueryEnabled } from "@/lib/auth/AuthProvider";
import { callAuthenticatedServerFn } from "@/lib/auth/authenticated-server-fn";
import { reportsHasExportableData } from "@/lib/reports/has-reports-data";
import { exportReportsCsv, getReportsSummary } from "@/utils/reports.functions";

export const Route = createFileRoute("/admin/reports")({
  head: () => ({ meta: [{ title: "Reports — AssetSphere" }] }),
  component: Reports,
});

function formatHours(value: number | null) {
  if (value === null) return "—";
  const hours = Math.floor(value);
  const minutes = Math.round((value - hours) * 60);
  return `${hours}h ${minutes}m`;
}

function Reports() {
  const authReady = useAuthQueryEnabled();
  const { data, isLoading } = useQuery({
    queryKey: ["reports-summary"],
    queryFn: () => callAuthenticatedServerFn(getReportsSummary),
    enabled: authReady,
  });

  const exportMut = useMutation({
    mutationFn: () => callAuthenticatedServerFn(exportReportsCsv),
    onSuccess: ({ csv, filename }) => {
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success("Report exported", { description: filename });
    },
    onError: (error: Error) => toast.error(error.message ?? "Export failed"),
  });

  const dep = data?.depreciationCurve ?? [];
  const usage = data?.departmentUsage ?? [];
  const vendors = data?.vendorPerformance ?? [];
  const heatmap = data?.lifecycleHeatmap ?? [];
  const hasDepData = dep.some((point) => point.value > 0);
  const hasUsageData = usage.some((point) => point.value > 0);
  const hasVendorData = vendors.length > 0;
  const hasHeatmapData = heatmap.some((cell) => cell.intensity > 0);
  const hasSlaData = (data?.slaAdherencePercent ?? 0) > 0 || (data?.kpis.openTickets ?? 0) > 0;

  const canExport = useMemo(() => !isLoading && reportsHasExportableData(data), [isLoading, data]);

  const exportDisabledReason = isLoading
    ? "Loading report data…"
    : !data
      ? "Report data is not available yet"
      : "Add assets, tickets, or vendors before exporting";

  const resolution = [
    { name: "SLA", value: data?.slaAdherencePercent ?? 0, fill: "var(--primary)" },
  ];

  const exportButton = (
    <Button
      type="button"
      variant="outline"
      className="h-9"
      onClick={() => exportMut.mutate()}
      disabled={exportMut.isPending || !canExport}
    >
      <Download className="h-4 w-4" />
      Export CSV
    </Button>
  );

  return (
    <PageShell variant="wide">
      <PageHeader
        title="Reports & Analytics"
        subtitle={
          isLoading
            ? "Loading analytics…"
            : "Metrics derived from stored assets, tickets, and vendors"
        }
        action={
          canExport ? (
            exportButton
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex">{exportButton}</span>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  {exportDisabledReason}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Avg Resolution", value: formatHours(data?.kpis.avgResolutionHours ?? null) },
          {
            label: "First Response",
            value:
              data?.kpis.firstResponseMinutes === null ||
              data?.kpis.firstResponseMinutes === undefined
                ? "—"
                : `${data.kpis.firstResponseMinutes}m`,
          },
          { label: "Open Tickets", value: String(data?.kpis.openTickets ?? 0) },
          {
            label: "Vendor SLA",
            value:
              data?.kpis.vendorSlaPercent === null || data?.kpis.vendorSlaPercent === undefined
                ? "—"
                : `${data.kpis.vendorSlaPercent}%`,
          },
        ].map((card) => (
          <StatCard key={card.label} label={card.label} value={card.value} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="p-6 lg:col-span-2">
          <h3 className="text-sm font-semibold mb-4">Asset Depreciation Curve</h3>
          {hasDepData ? (
            <div className="h-72">
              <ResponsiveContainer>
                <AreaChart data={dep}>
                  <defs>
                    <linearGradient id="ar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="var(--border)" />
                  <XAxis
                    dataKey="month"
                    stroke="var(--muted-foreground)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="var(--muted-foreground)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid var(--border)",
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    fill="url(#ar)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState
              icon={TrendingDown}
              title="No depreciation data"
              description="Add assets with purchase dates to see remaining book value over time."
              className="py-10"
            />
          )}
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-semibold mb-4">SLA Adherence</h3>
          {hasSlaData ? (
            <>
              <div className="h-56">
                <ResponsiveContainer>
                  <RadialBarChart
                    innerRadius="70%"
                    outerRadius="100%"
                    data={resolution}
                    startAngle={90}
                    endAngle={-270}
                  >
                    <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                    <RadialBar
                      background={{ fill: "var(--muted)" }}
                      dataKey="value"
                      cornerRadius={10}
                    />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
              <div className="text-center -mt-32 mb-12 relative z-10 pointer-events-none">
                <div className="text-3xl font-semibold">{data?.slaAdherencePercent ?? 0}%</div>
                <div className="text-xs text-muted-foreground">of tickets met SLA</div>
              </div>
            </>
          ) : (
            <EmptyState
              title="No SLA data yet"
              description="Resolve or close tickets to calculate adherence against your SLA targets."
              className="py-10"
            />
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="p-6 lg:col-span-2">
          <h3 className="text-sm font-semibold mb-4">Department Asset Usage</h3>
          {hasUsageData ? (
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={usage} layout="vertical" margin={{ left: 16 }}>
                  <CartesianGrid horizontal={false} stroke="var(--border)" />
                  <XAxis
                    type="number"
                    stroke="var(--muted-foreground)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="var(--muted-foreground)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    width={90}
                  />
                  <RechartsTooltip
                    cursor={{ fill: "var(--muted)" }}
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid var(--border)",
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="value" fill="var(--primary)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState
              title="No department breakdown"
              description="Assign departments on assets to compare usage across teams."
              className="py-10"
            />
          )}
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-semibold mb-4">Vendor Performance</h3>
          {hasVendorData ? (
            <ul className="space-y-4">
              {vendors.map((vendor) => (
                <li key={vendor.name}>
                  <div className="flex items-center justify-between text-sm">
                    <span>{vendor.name}</span>
                    <span className="font-medium">{vendor.slaPercent}%</span>
                  </div>
                  <div className="mt-1.5 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${vendor.slaPercent}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="No vendors yet"
              description="Add vendors in the directory to track SLA performance here."
              className="py-8"
            />
          )}
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-sm font-semibold mb-4">Asset Lifecycle Heatmap</h3>
        {hasHeatmapData ? (
          <div className="grid grid-cols-12 gap-1.5">
            {heatmap.map((cell) => (
              <div
                key={cell.week}
                className="aspect-square rounded"
                style={{
                  background: `color-mix(in oklab, var(--primary) ${Math.round(cell.intensity * 100)}%, var(--muted))`,
                }}
                title={`Week ${cell.week}`}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={BarChart3}
            title="No lifecycle activity"
            description="Asset and maintenance events will fill this heatmap over time."
            className="py-8"
          />
        )}
      </Card>
    </PageShell>
  );
}
