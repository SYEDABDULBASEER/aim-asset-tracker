import { createFileRoute } from "@tanstack/react-router";
import { Card, PageHeader } from "@/components/ui-kit/Card";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, RadialBarChart, RadialBar, PolarAngleAxis,
} from "recharts";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Reports — Asset Desk" }] }),
  component: Reports,
});

const dep = [
  { d: "Jan", v: 100 }, { d: "Feb", v: 96 }, { d: "Mar", v: 92 }, { d: "Apr", v: 88 },
  { d: "May", v: 85 }, { d: "Jun", v: 82 }, { d: "Jul", v: 78 }, { d: "Aug", v: 74 },
  { d: "Sep", v: 70 }, { d: "Oct", v: 67 }, { d: "Nov", v: 64 }, { d: "Dec", v: 60 },
];

const usage = [
  { name: "IT", value: 412 }, { name: "Operations", value: 286 },
  { name: "Finance", value: 178 }, { name: "Marketing", value: 144 },
  { name: "HR", value: 132 }, { name: "Design", value: 132 },
];

const resolution = [{ name: "SLA", value: 88, fill: "var(--primary)" }];

function Reports() {
  return (
    <div className="p-8 max-w-[1600px] mx-auto">
      <PageHeader title="Reports & Analytics" subtitle="Asset lifecycle, ticket performance, and vendor insights" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { l: "Avg Resolution", v: "4h 22m", s: "-12%" },
          { l: "First Response", v: "18m", s: "-7%" },
          { l: "Repair Cost (YTD)", v: "$54,300", s: "+3%" },
          { l: "Vendor SLA", v: "96.4%", s: "+1.2%" },
        ].map((k) => (
          <Card key={k.l} className="p-5">
            <div className="text-xs text-muted-foreground">{k.l}</div>
            <div className="text-2xl font-semibold mt-2">{k.v}</div>
            <div className="text-[11px] text-success mt-1">{k.s} vs last quarter</div>
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
                <XAxis dataKey="d" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", fontSize: 12 }} />
                <Area type="monotone" dataKey="v" stroke="var(--primary)" strokeWidth={2} fill="url(#ar)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-semibold mb-4">SLA Adherence</h3>
          <div className="h-56">
            <ResponsiveContainer>
              <RadialBarChart innerRadius="70%" outerRadius="100%" data={resolution} startAngle={90} endAngle={-270}>
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                <RadialBar background={{ fill: "var(--muted)" }} dataKey="value" cornerRadius={10} />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center -mt-32 mb-12 relative z-10 pointer-events-none">
            <div className="text-3xl font-semibold">88%</div>
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
                <XAxis type="number" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} width={90} />
                <Tooltip cursor={{ fill: "var(--muted)" }} contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", fontSize: 12 }} />
                <Bar dataKey="value" fill="var(--primary)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-semibold mb-4">Vendor Performance</h3>
          <ul className="space-y-4">
            {[
              { v: "TechCare Services", s: 98 },
              { v: "PrintWorks Co.", s: 92 },
              { v: "NetSecure Ltd.", s: 88 },
              { v: "Cloud9 Hardware", s: 81 },
            ].map((x) => (
              <li key={x.v}>
                <div className="flex items-center justify-between text-sm">
                  <span>{x.v}</span><span className="font-medium">{x.s}%</span>
                </div>
                <div className="mt-1.5 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${x.s}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-sm font-semibold mb-4">Asset Lifecycle Heatmap</h3>
        <div className="grid grid-cols-12 gap-1.5">
          {Array.from({ length: 84 }).map((_, i) => {
            const intensity = Math.random();
            return (
              <div
                key={i}
                className="aspect-square rounded"
                style={{ background: `color-mix(in oklab, var(--primary) ${Math.round(intensity * 100)}%, var(--muted))` }}
                title={`Week ${i + 1}`}
              />
            );
          })}
        </div>
        <div className="flex items-center justify-end gap-2 mt-3 text-[11px] text-muted-foreground">
          Less
          {[10, 30, 60, 90].map((p) => (
            <span key={p} className="h-3 w-3 rounded" style={{ background: `color-mix(in oklab, var(--primary) ${p}%, var(--muted))` }} />
          ))}
          More
        </div>
      </Card>
    </div>
  );
}
