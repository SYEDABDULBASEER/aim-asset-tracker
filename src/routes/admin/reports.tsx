import { createFileRoute } from "@tanstack/react-router";
import { Card, PageHeader } from "@/components/ui-kit/Card";
import { Button } from "@/components/ui/button";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from "recharts";
import { Download } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { callAuthenticatedServerFn } from "@/lib/auth/authenticated-server-fn";
import { exportReportsCsv, getReportsSummary } from "@/utils/reports.functions";

export const Route = createFileRoute("/admin/reports")({
  head: () => ({ meta: [{ title: "Reports — Asset Desk" }] }),
  component: Reports,
});

function formatHours(value: number | null) {
  if (value === null) return "—";
  const hours = Math.floor(value);
  const minutes = Math.round((value - hours) * 60);
  return `${hours}h ${minutes}m`;
}

function Reports() {
  const { data, isLoading } = useQuery({
    queryKey: ["reports-summary"],
    queryFn: () => callAuthenticatedServerFn(getReportsSummary),
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
  const resolution = [
    { name: "SLA", value: data?.slaAdherencePercent ?? 0, fill: "var(--primary)" },
  ];

  return (
    <div className="p-8 max-w-[1600px] mx-auto">
      <PageHeader
        title="Reports & Analytics"
        subtitle={
          isLoading
            ? "Loading analytics…"
            : "Metrics derived from stored assets, tickets, and vendors"
        }
        action={
          <Button
            type="button"
            variant="outline"
            className="h-9"
            onClick={() => exportMut.mutate()}
            disabled={exportMut.isPending || isLoading}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
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
          <Card key={card.label} className="p-5">
            <div className="text-xs text-muted-foreground">{card.label}</div>
            <div className="text-2xl font-semibold mt-2">{card.value}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="p-6 lg:col-span-2">
          <h3 className="text-sm font-semibold mb-4">Asset Depreciation Curve</h3>
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
                <Tooltip
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
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-semibold mb-4">SLA Adherence</h3>
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
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="p-6 lg:col-span-2">
          <h3 className="text-sm font-semibold mb-4">Department Asset Usage</h3>
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
                <Tooltip
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
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-semibold mb-4">Vendor Performance</h3>
          <ul className="space-y-4">
            {(data?.vendorPerformance ?? []).map((vendor) => (
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
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-sm font-semibold mb-4">Asset Lifecycle Heatmap</h3>
        <div className="grid grid-cols-12 gap-1.5">
          {(data?.lifecycleHeatmap ?? []).map((cell) => (
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
      </Card>
    </div>
  );
}
