import { createFileRoute } from "@tanstack/react-router";
import { Card, StatusPill, PageHeader } from "@/components/ui-kit/Card";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";
import {
  Package,
  Activity,
  Wrench,
  Ticket,
  ShieldAlert,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  ClipboardList,
  LifeBuoy,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { callAuthenticatedServerFn } from "@/lib/auth/authenticated-server-fn";
import { useAuthQueryEnabled } from "@/lib/auth/AuthProvider";
import { getDashboardSummary } from "@/utils/dashboard.functions";

const PORTAL_TICKET_POPUP_SEEN_KEY = "assetdesk.portalTicketPopupSeen.v1";

type PortalTicketPopup = {
  id: string;
  title: string;
  requesterName: string | null;
  priority: string;
  createdAt: string;
};

function loadSeenPortalPopupIds(): Set<string> {
  try {
    const raw = localStorage.getItem(PORTAL_TICKET_POPUP_SEEN_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return new Set(
      Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [],
    );
  } catch {
    return new Set();
  }
}

function saveSeenPortalPopupIds(seen: Set<string>) {
  try {
    localStorage.setItem(PORTAL_TICKET_POPUP_SEEN_KEY, JSON.stringify([...seen]));
  } catch {
    /* ignore */
  }
}

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Dashboard — Asset Desk" }] }),
  component: Dashboard,
});

const pieDataFallback = [
  { name: "Laptop", value: 480 },
  { name: "Monitor", value: 312 },
  { name: "Printer", value: 88 },
  { name: "Mobile", value: 196 },
  { name: "Network", value: 124 },
  { name: "Desktop", value: 84 },
];
const PIE_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--info)",
];

function priorityTone(p: string) {
  const v =
    p === "Critical" ? "danger" : p === "High" ? "warning" : p === "Medium" ? "info" : "muted";
  return (v satisfies Parameters<typeof StatusPill>[0]["tone"]) ? v : "muted";
}
function statusTone(s: string) {
  const v =
    s === "Resolved"
      ? "success"
      : s === "Open" || s === "In Progress"
        ? "info"
        : s === "Waiting Parts"
          ? "warning"
          : s === "Closed"
            ? "muted"
            : "muted";
  return (v satisfies Parameters<typeof StatusPill>[0]["tone"]) ? v : "muted";
}

function Dashboard() {
  const navigate = useNavigate();
  const [popupQueue, setPopupQueue] = useState<PortalTicketPopup[]>([]);
  const activePopup = popupQueue[0] ?? null;

  const authReady = useAuthQueryEnabled();

  const { data: summary, isLoading } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: () => callAuthenticatedServerFn(getDashboardSummary),
    enabled: authReady,
    refetchInterval: 15_000,
  });

  const portalOpen = useMemo(
    () => summary?.tickets.userPortalOpen ?? [],
    [summary?.tickets.userPortalOpen],
  );

  useEffect(() => {
    if (typeof window === "undefined" || portalOpen.length === 0) return;
    const seen = loadSeenPortalPopupIds();
    const unseen = portalOpen.filter((t) => !seen.has(t.id));
    if (unseen.length === 0) return;

    setPopupQueue((prev) => {
      const queued = new Set(prev.map((p) => p.id));
      const toAdd = unseen.filter((t) => !queued.has(t.id));
      if (toAdd.length === 0) return prev;
      const ordered = [...toAdd].sort((a, b) =>
        a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0,
      );
      return [...prev, ...ordered];
    });
  }, [portalOpen]);

  const dismissPortalPopup = useCallback(
    (goToTickets: boolean) => {
      if (!activePopup) return;
      const seen = loadSeenPortalPopupIds();
      seen.add(activePopup.id);
      saveSeenPortalPopupIds(seen);
      setPopupQueue((prev) => prev.slice(1));
      if (goToTickets) void navigate({ to: "/admin/tickets" });
    },
    [activePopup, navigate],
  );

  const ticketVolume = useMemo(
    () => summary?.tickets.volumeLast7Days ?? [],
    [summary?.tickets.volumeLast7Days],
  );
  const recentActivity = summary?.recentActivity ?? [];
  const maintenanceVolume = useMemo(
    () =>
      ticketVolume.map((point) => ({
        day: point.day,
        tickets: (point.Open ?? 0) + (point.Resolved ?? 0),
      })),
    [ticketVolume],
  );
  const hasMaintenanceVolume = maintenanceVolume.some((point) => point.tickets > 0);

  const totals = summary?.totals;
  const kpis = [
    {
      label: "Total Assets",
      value: totals ? String(totals.totalAssets) : "—",
      delta: "Inventory",
      up: true,
      icon: Package,
      tone: "info" as const,
    },
    {
      label: "Active Assets",
      value: totals ? String(totals.activeAssets) : "—",
      delta: totals
        ? `${Math.round((totals.activeAssets / Math.max(1, totals.totalAssets)) * 100)}% active`
        : "—",
      up: true,
      icon: Activity,
      tone: "success" as const,
    },
    {
      label: "Under Repair",
      value: totals ? String(totals.underRepair) : "—",
      delta: totals ? `${totals.underRepair} in queue` : "—",
      up: false,
      icon: Wrench,
      tone: "warning" as const,
    },
    {
      label: "Warranty Risks",
      value: totals ? String(totals.warrantyExpired + totals.warrantyExpiring) : "—",
      delta: totals ? `${totals.warrantyExpired} expired` : "—",
      up: false,
      icon: ShieldAlert,
      tone: "warning" as const,
    },
    {
      label: "Open Tickets",
      value: summary ? String(summary.tickets.open) : "—",
      delta: summary
        ? `${summary.tickets.slaBreached} SLA breach${summary.tickets.slaBreached === 1 ? "" : "es"}`
        : "—",
      up: summary ? summary.tickets.slaBreached === 0 : false,
      icon: Ticket,
      tone: summary && summary.tickets.slaBreached > 0 ? ("danger" as const) : ("info" as const),
    },
    {
      label: "Lost Assets",
      value: totals ? String(totals.lost) : "—",
      delta: totals && totals.lost > 0 ? "Needs closure" : "On track",
      up: totals ? totals.lost === 0 : false,
      icon: AlertTriangle,
      tone: (totals?.lost ?? 0) > 0 ? ("danger" as const) : ("success" as const),
    },
    {
      label: "Audit Hygiene",
      value: totals ? String(totals.unassigned) : "—",
      delta: "Unassigned",
      up: (totals?.unassigned ?? 0) === 0,
      icon: ClipboardList,
      tone: (totals?.unassigned ?? 0) > 0 ? ("info" as const) : ("success" as const),
    },
  ];

  const pieData = summary?.byCategory?.length ? summary.byCategory : pieDataFallback;

  return (
    <div className="p-8 max-w-[1600px] mx-auto">
      <AlertDialog
        open={activePopup !== null}
        onOpenChange={(open) => {
          if (!open) dismissPortalPopup(false);
        }}
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                <LifeBuoy className="h-5 w-5 text-primary" />
              </div>
              <div className="text-left min-w-0">
                <AlertDialogTitle>New user support request</AlertDialogTitle>
                <AlertDialogDescription className="mt-1">
                  A ticket was submitted from the public Report an issue page.
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          {activePopup ? (
            <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm space-y-1.5">
              <div className="font-mono text-xs text-muted-foreground">{activePopup.id}</div>
              <div className="font-medium leading-snug">{activePopup.title}</div>
              <div className="text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-1">
                <span>From: {activePopup.requesterName ?? "Unknown"}</span>
                <span>Priority: {activePopup.priority}</span>
                <span>{format(new Date(activePopup.createdAt), "dd MMM yyyy HH:mm")}</span>
              </div>
              {popupQueue.length > 1 ? (
                <p className="text-[11px] text-muted-foreground pt-1">
                  +{popupQueue.length - 1} more request{popupQueue.length - 1 === 1 ? "" : "s"} in
                  queue
                </p>
              ) : null}
            </div>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => dismissPortalPopup(false)}>Dismiss</AlertDialogCancel>
            <AlertDialogAction onClick={() => dismissPortalPopup(true)}>
              Open ticket queue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PageHeader
        title="IT Operations Overview"
        subtitle={
          isLoading
            ? "Loading leadership insights…"
            : "Executive view of asset health, risk, and operational load."
        }
      />

      {portalOpen.length > 0 && (
        <Card className="p-5 mb-6 border-primary/30 bg-primary/5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground">User-submitted requests</h2>
              <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
                These tickets were opened from the public{" "}
                <Link to="/user/request-support" className="text-primary font-medium hover:underline">
                  Report an issue
                </Link>{" "}
                page and are still <span className="font-medium">Open</span>.
              </p>
            </div>
            <Link
              to="/admin/tickets"
              className="shrink-0 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition"
            >
              Open ticket queue
            </Link>
          </div>
          <ul className="mt-4 divide-y divide-border rounded-lg border border-border bg-card">
            {portalOpen.slice(0, 6).map((t) => (
              <li
                key={t.id}
                className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-3 text-sm"
              >
                <span className="font-mono text-xs text-muted-foreground">{t.id}</span>
                <span className="font-medium min-w-0 flex-1">{t.title}</span>
                <span className="text-xs text-muted-foreground">
                  {t.requesterName ?? "—"} · {format(new Date(t.createdAt), "dd MMM HH:mm")}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-7 gap-4 mb-6">
        {kpis.map((k) => (
          <Card key={k.label} className="p-5">
            <div className="flex items-start justify-between">
              <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                <k.icon className="h-4 w-4 text-foreground" />
              </div>
              <span
                className={`inline-flex items-center text-[11px] font-medium ${k.up ? "text-success" : "text-destructive"}`}
              >
                {k.up ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                {k.delta}
              </span>
            </div>
            <div className="mt-4 text-2xl font-semibold tracking-tight">{k.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{k.label}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              Actionable Insights (IT Director)
            </h3>
            <Link to="/admin/reports" className="text-xs text-primary font-medium hover:underline">
              View analytics
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(summary?.recommendedActions ?? []).slice(0, 3).map((a) => (
              <div key={a.title} className="rounded-xl border border-border p-4 bg-card">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold leading-snug">{a.title}</div>
                    <div className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      {a.detail}
                    </div>
                  </div>
                  <StatusPill tone={a.tone}>Priority</StatusPill>
                </div>
                {a.ctaTo && a.ctaLabel && (
                  <div className="mt-3">
                    <Link to={a.ctaTo} className="text-xs text-primary font-medium hover:underline">
                      {a.ctaLabel}
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Risk & Compliance Alerts</h3>
            <Link
              to="/admin/assets"
              search={{ q: undefined }}
              className="text-xs text-primary font-medium hover:underline"
            >
              Review
            </Link>
          </div>
          <ul className="space-y-3">
            {(
              summary?.alerts ?? [
                {
                  tone: "info",
                  title: "No critical alerts detected",
                  detail:
                    "Once assets/tickets are fully connected, this panel will surface real-time risk signals.",
                },
              ]
            )
              .slice(0, 5)
              .map((a) => (
                <li key={a.title} className="border border-border rounded-lg p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium">{a.title}</div>
                      <div className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                        {a.detail}
                      </div>
                    </div>
                    <StatusPill tone={a.tone}>{a.tone.toUpperCase()}</StatusPill>
                  </div>
                  {a.ctaTo && a.ctaLabel && (
                    <div className="mt-2">
                      <Link
                        to={a.ctaTo}
                        className="text-xs text-primary font-medium hover:underline"
                      >
                        {a.ctaLabel}
                      </Link>
                    </div>
                  )}
                </li>
              ))}
          </ul>
        </Card>
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
                <Pie
                  data={pieData}
                  dataKey="value"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={2}
                  stroke="none"
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    fontSize: 12,
                  }}
                />
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
            <h3 className="text-sm font-semibold">Ticket volume (last 7 days)</h3>
            <div className="flex gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[var(--chart-1)]" />
                Opened
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[var(--chart-2)]" />
                Resolved / Closed
              </span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart
                data={ticketVolume.length ? ticketVolume : [{ day: "—", Open: 0, Resolved: 0 }]}
                barGap={6}
              >
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="day"
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
                  cursor={{ fill: "var(--muted)" }}
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    fontSize: 12,
                  }}
                />
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
            <h3 className="text-sm font-semibold">Maintenance workload</h3>
            <span className="text-xs text-muted-foreground">Ticket volume proxy</span>
          </div>
          {hasMaintenanceVolume ? (
            <div className="h-56">
              <ResponsiveContainer>
                <LineChart data={maintenanceVolume}>
                  <CartesianGrid vertical={false} stroke="var(--border)" />
                  <XAxis
                    dataKey="day"
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
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid var(--border)",
                      fontSize: 12,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="tickets"
                    stroke="var(--primary)"
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No ticket volume data yet. This chart appears once service desk activity is recorded.
            </p>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-semibold mb-4">Recent Activity</h3>
          <ul className="space-y-4">
            {recentActivity.length === 0 ? (
              <li className="text-sm text-muted-foreground">No recent activity recorded.</li>
            ) : (
              recentActivity.map((entry) => {
                const initials = (entry.actorEmail ?? entry.entityId)
                  .split(/[@.\s_-]+/)
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((part) => part[0]?.toUpperCase() ?? "")
                  .join("");
                return (
                  <li key={entry.id} className="flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-muted text-[11px] font-semibold flex items-center justify-center shrink-0">
                      {initials || "AD"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm leading-snug">
                        {entry.action} · {entry.entityType} {entry.entityId}
                      </p>
                      <span className="text-[11px] text-muted-foreground">
                        {format(new Date(entry.createdAt), "dd MMM yyyy HH:mm")}
                      </span>
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </Card>
      </div>

      <Card className="p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">Recent Tickets</h3>
          <Link to="/admin/tickets" className="text-xs text-primary font-medium hover:underline">
            View all
          </Link>
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
              {(summary?.tickets.recent ?? []).map((t) => (
                <tr key={t.id} className="border-t border-border hover:bg-muted/40 transition">
                  <td className="px-6 py-3 font-medium">
                    <Link to="/admin/tickets" className="hover:text-primary hover:underline">
                      {t.id}
                    </Link>
                  </td>
                  <td className="px-6 py-3">{t.title}</td>
                  <td className="px-6 py-3 text-muted-foreground">{t.assetId ?? "—"}</td>
                  <td className="px-6 py-3">
                    <StatusPill tone={priorityTone(t.priority)}>{t.priority}</StatusPill>
                  </td>
                  <td className="px-6 py-3">
                    <StatusPill tone={statusTone(t.status)}>{t.status}</StatusPill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
