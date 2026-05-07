import { createFileRoute } from "@tanstack/react-router";
import { Card, PageHeader, StatusPill } from "@/components/ui-kit/Card";
import { LayoutGrid, List, Plus, Clock, Paperclip, MessageSquare } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/tickets")({
  head: () => ({ meta: [{ title: "Tickets — Asset Desk" }] }),
  component: Tickets,
});

const tickets = [
  { id: "TKT-1031", title: "Laptop overheating issue", asset: "LAP-0001", priority: "Critical", status: "Open", tech: "Sarah Ali", sla: "2h 14m", created: "Today" },
  { id: "TKT-1030", title: "VPN disconnecting frequently", asset: "LAP-0085", priority: "High", status: "Open", tech: "Mohammed Faisal", sla: "5h 02m", created: "Today" },
  { id: "TKT-1029", title: "Printer toner replacement", asset: "PRT-0102", priority: "Medium", status: "In Progress", tech: "David Mathew", sla: "1d 4h", created: "Yesterday" },
  { id: "TKT-1027", title: "Monitor display flickering", asset: "MON-0021", priority: "High", status: "Waiting Parts", tech: "Sarah Ali", sla: "Paused", created: "2d ago" },
  { id: "TKT-1024", title: "Network switch not responding", asset: "NET-0044", priority: "Critical", status: "Resolved", tech: "Priya Sharma", sla: "Met", created: "3d ago" },
  { id: "TKT-1018", title: "Mouse not detecting", asset: "ACC-0312", priority: "Low", status: "Closed", tech: "David Mathew", sla: "Met", created: "5d ago" },
];

const cols = ["Open", "In Progress", "Waiting Parts", "Resolved", "Closed"] as const;

function priorityTone(p: string) {
  return p === "Critical" ? "danger" : p === "High" ? "warning" : p === "Medium" ? "info" : "muted";
}
function statusTone(s: string) {
  return s === "Resolved" ? "success" : s === "Open" ? "info" : s === "Waiting Parts" ? "warning" : s === "Closed" ? "muted" : "info";
}

function Tickets() {
  const [view, setView] = useState<"kanban" | "table">("kanban");
  return (
    <div className="p-8 max-w-[1600px] mx-auto">
      <PageHeader
        title="Tickets"
        subtitle="Service desk · 26 open · 4 SLA at risk"
        action={
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-muted rounded-lg p-0.5">
              <button onClick={() => setView("kanban")} className={`h-8 px-3 rounded-md text-sm inline-flex items-center gap-1.5 ${view === "kanban" ? "bg-card shadow-soft" : "text-muted-foreground"}`}><LayoutGrid className="h-4 w-4" />Kanban</button>
              <button onClick={() => setView("table")} className={`h-8 px-3 rounded-md text-sm inline-flex items-center gap-1.5 ${view === "table" ? "bg-card shadow-soft" : "text-muted-foreground"}`}><List className="h-4 w-4" />Table</button>
            </div>
            <button className="h-9 px-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium inline-flex items-center gap-1.5 shadow-soft"><Plus className="h-4 w-4" />New Ticket</button>
          </div>
        }
      />

      {view === "kanban" ? (
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
          {cols.map((col) => {
            const list = tickets.filter((t) => t.status === col);
            return (
              <div key={col} className="bg-muted/40 rounded-xl p-3 min-h-[400px]">
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <StatusPill tone={statusTone(col) as any}>{col}</StatusPill>
                    <span className="text-xs text-muted-foreground">{list.length}</span>
                  </div>
                  <button className="h-6 w-6 rounded hover:bg-card flex items-center justify-center"><Plus className="h-3.5 w-3.5" /></button>
                </div>
                <div className="space-y-2">
                  {list.map((t) => (
                    <Card key={t.id} className="p-3 hover:shadow-elevated transition cursor-pointer">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-mono text-muted-foreground">{t.id}</span>
                        <StatusPill tone={priorityTone(t.priority) as any}>{t.priority}</StatusPill>
                      </div>
                      <div className="text-sm font-medium leading-snug">{t.title}</div>
                      <div className="text-[11px] text-muted-foreground mt-1">{t.asset}</div>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          <Clock className="h-3 w-3" />{t.sla}
                        </div>
                        <div className="h-6 w-6 rounded-full bg-gradient-to-br from-primary to-chart-5 text-white text-[10px] font-semibold flex items-center justify-center">
                          {t.tech.split(" ").map(s => s[0]).join("")}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
                {["Ticket", "Title", "Asset", "Priority", "Status", "Technician", "SLA", "Created"].map(h => (
                  <th key={h} className="text-left font-medium px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t.id} className="border-t border-border hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs">{t.id}</td>
                  <td className="px-4 py-3">{t.title}</td>
                  <td className="px-4 py-3 text-muted-foreground">{t.asset}</td>
                  <td className="px-4 py-3"><StatusPill tone={priorityTone(t.priority) as any}>{t.priority}</StatusPill></td>
                  <td className="px-4 py-3"><StatusPill tone={statusTone(t.status) as any}>{t.status}</StatusPill></td>
                  <td className="px-4 py-3">{t.tech}</td>
                  <td className="px-4 py-3 text-muted-foreground">{t.sla}</td>
                  <td className="px-4 py-3 text-muted-foreground">{t.created}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Card className="mt-6 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <span className="text-[11px] font-mono text-muted-foreground">TKT-1031</span>
            <h3 className="text-lg font-semibold mt-0.5">Laptop overheating issue</h3>
            <div className="flex gap-2 mt-2">
              <StatusPill tone="danger">Critical</StatusPill>
              <StatusPill tone="info">Open</StatusPill>
              <span className="text-xs text-muted-foreground self-center">Linked to LAP-0001 · Ahmed Khan</span>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="h-8 w-8 rounded-full bg-muted text-[11px] font-semibold flex items-center justify-center">AK</div>
            <div className="flex-1 bg-muted/40 rounded-lg p-3">
              <div className="text-xs font-medium">Ahmed Khan <span className="text-muted-foreground font-normal">· 2h ago</span></div>
              <p className="text-sm mt-1">Laptop becomes very hot after 30 min of use, fan running at max. Already cleaned vents last month.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="h-8 w-8 rounded-full bg-muted text-[11px] font-semibold flex items-center justify-center">SA</div>
            <div className="flex-1 bg-muted/40 rounded-lg p-3">
              <div className="text-xs font-medium">Sarah Ali <span className="text-muted-foreground font-normal">· 1h ago</span></div>
              <p className="text-sm mt-1">Bringing it to the workshop today. Will repaste thermal compound and replace fan if needed.</p>
            </div>
          </div>
          <div className="border border-border rounded-lg p-3">
            <textarea placeholder="Write a comment…" className="w-full text-sm bg-transparent focus:outline-none resize-none" rows={2} />
            <div className="flex items-center justify-between mt-2">
              <button className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"><Paperclip className="h-3.5 w-3.5" />Attach</button>
              <button className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium inline-flex items-center gap-1.5"><MessageSquare className="h-3.5 w-3.5" />Comment</button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
