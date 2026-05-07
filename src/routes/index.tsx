import { createFileRoute } from "@tanstack/react-router";
import { Card, StatusPill, PageHeader } from "@/components/ui-kit/Card";
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid, LineChart, Line, Legend,
} from "recharts";
import { Package, Activity, Wrench, Ticket, ShieldAlert, AlertTriangle, ArrowUpRight, ArrowDownRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Dashboard — Asset Desk" }] }),
  component: Dashboard,
});

const kpis = [
  { label: "Total Assets", value: "1,284", delta: "+4.2%", up: true, icon: Package, tone: "info" as const },
  { label: "Active Assets", value: "1,102", delta: "+1.8%", up: true, icon: Activity, tone: "success" as const },
  { label: "Under Repair", value: "48", delta: "-6", up: false, icon: Wrench, tone: "warning" as const },
  { label: "Open Tickets", value: "26", delta: "+3", up: true, icon: Ticket, tone: "info" as const },
  { label: "Warranty Expiring", value: "14", delta: "30 days", up: false, icon: ShieldAlert, tone: "warning" as const },
  { label: "Lost Assets", value: "3", delta: "+1", up: true, icon: AlertTriangle, tone: "danger" as const },
];

const pieData = [
  { name: "Laptops", value: 480 },
  { name: "Monitors", value: 312 },
  { name: "Printers", value: 88 },
  { name: "Mobiles", value: 196 },
  { name: "Network", value: 124 },
  { name: "Servers", value: 84 },
];
const PIE_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--info)"];

const ticketData = [
  { day: "Mon", Open: 8, Resolved: 12 },
  { day: "Tue", Open: 12, Resolved: 9 },
  { day: "Wed", Open: 6, Resolved: 14 },
  { day: "Thu", Open: 10, Resolved: 11 },
  { day: "Fri", Open: 14, Resolved: 16 },
  { day: "Sat", Open: 4, Resolved: 6 },
  { day: "Sun", Open: 3, Resolved: 5 },
];

const costData = [
  { m: "Jan", cost: 4200 }, { m: "Feb", cost: 3800 }, { m: "Mar", cost: 5100 },
  { m: "Apr", cost: 4600 }, { m: "May", cost: 6200 }, { m: "Jun", cost: 5400 },
  { m: "Jul", cost: 7100 }, { m: "Aug", cost: 6300 }, { m: "Sep", cost: 5800 },
];

const activity = [
  { who: "AK", what: "Laptop assigned to Ahmed Khan", when: "2m ago", tone: "info" as const },
  { who: "SY", what: "Ticket #TKT-1024 resolved by Sarah Yousuf", when: "18m ago", tone: "success" as const },
  { who: "MF", what: "Printer moved to Finance Department", when: "1h ago", tone: "muted" as const },
  { who: "PS", what: "Warranty expiring for Dell Latitude 7420", when: "3h ago", tone: "warning" as const },
  { who: "DM", what: "Maintenance scheduled for HP LaserJet Pro", when: "Yesterday", tone: "info" as const },
];

const tickets = [
  { id: "TKT-1031", title: "Laptop overheating issue", asset: "LAP-0001", priority: "Critical", status: "Open" },
  { id: "TKT-1029", title: "Printer toner replacement", asset: "PRT-0102", priority: "Medium", status: "In Progress" },
  { id: "TKT-1027", title: "Monitor display flickering", asset: "MON-0021", priority: "High", status: "Waiting Parts" },
  { id: "TKT-1024", title: "Network switch not responding", asset: "NET-0044", priority: "Critical", status: "Resolved" },
];

function priorityTone(p: string) {
  return p === "Critical" ? "danger" : p === "High" ? "warning" : p === "Medium" ? "info" : "muted";
}
function statusTone(s: string) {
  return s === "Resolved" ? "success" : s === "Open" ? "info" : s === "Waiting Parts" ? "warning" : "muted";
}

function Dashboard() {
  return (
    <div className="p-8 max-w-[1600px] mx-auto">
      <PageHeader
        title="Operations Overview"
        subtitle="Welcome back, Ahmed. Here's what's happening across EClickTech today."
      />

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        {kpis.map((k) => (
          <Card key={k.label} className="p-5">
            <div className="flex items-start justify-between">
              <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                <k.icon className="h-4 w-4 text-foreground" />
              </div>
              <span className={`inline-flex items-center text-[11px] font-medium ${k.up ? "text-success" : "text-destructive"}`}>
                {k.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {k.delta}
              </span>
            </div>
            <div className="mt-4 text-2xl font-semibold tracking-tight">{k.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{k.label}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="p-6 lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Asset Distribution</h3>
            <span className="text-xs text-muted-foreground">By category</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={pieData} dataKey="value" innerRadius={55} outerRadius={85} paddingAngle={2} stroke="none">
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {pieData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-2 text-xs">
                <span className="h-2 w-2 rounded-full" style={{ background: PIE_COLORS[i] }} />
                <span className="text-muted-foreground">{d.name}</span>
                <span className="ml-auto font-medium">{d.value}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Ticket Status (last 7 days)</h3>
            <div className="flex gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[var(--chart-1)]" />Open</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[var(--chart-2)]" />Resolved</span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={ticketData} barGap={6}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: "var(--muted)" }} contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", fontSize: 12 }} />
                <Bar dataKey="Open" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Resolved" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Monthly Maintenance Cost</h3>
            <span className="text-xs text-muted-foreground">USD</span>
          </div>
          <div className="h-56">
            <ResponsiveContainer>
              <LineChart data={costData}>
                <defs>
                  <linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="m" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", fontSize: 12 }} />
                <Line type="monotone" dataKey="cost" stroke="var(--primary)" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-semibold mb-4">Recent Activity</h3>
          <ul className="space-y-4">
            {activity.map((a, i) => (
              <li key={i} className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-muted text-[11px] font-semibold flex items-center justify-center shrink-0">{a.who}</div>
                <div className="min-w-0">
                  <p className="text-sm leading-snug">{a.what}</p>
                  <span className="text-[11px] text-muted-foreground">{a.when}</span>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">Recent Tickets</h3>
          <button className="text-xs text-primary font-medium hover:underline">View all</button>
        </div>
        <div className="overflow-x-auto -mx-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="text-left font-medium px-6 py-2">Ticket</th>
                <th className="text-left font-medium px-6 py-2">Title</th>
                <th className="text-left font-medium px-6 py-2">Asset</th>
                <th className="text-left font-medium px-6 py-2">Priority</th>
                <th className="text-left font-medium px-6 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t.id} className="border-t border-border hover:bg-muted/40 transition">
                  <td className="px-6 py-3 font-medium">{t.id}</td>
                  <td className="px-6 py-3">{t.title}</td>
                  <td className="px-6 py-3 text-muted-foreground">{t.asset}</td>
                  <td className="px-6 py-3"><StatusPill tone={priorityTone(t.priority) as any}>{t.priority}</StatusPill></td>
                  <td className="px-6 py-3"><StatusPill tone={statusTone(t.status) as any}>{t.status}</StatusPill></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
