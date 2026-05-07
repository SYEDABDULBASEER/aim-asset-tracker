import { createFileRoute } from "@tanstack/react-router";
import { Card, PageHeader, StatusPill } from "@/components/ui-kit/Card";
import { Calendar, Plus } from "lucide-react";

export const Route = createFileRoute("/maintenance")({
  head: () => ({ meta: [{ title: "Maintenance — Asset Desk" }] }),
  component: Maintenance,
});

const rows = [
  { id: "MNT-220", asset: "LAP-0001 · Dell Latitude 7440", type: "Preventive", vendor: "TechCare Services", date: "12 May 2026", status: "Scheduled" },
  { id: "MNT-219", asset: "PRT-0102 · HP LaserJet Pro", type: "Repair", vendor: "PrintWorks Co.", date: "08 May 2026", status: "In Progress" },
  { id: "MNT-218", asset: "NET-0044 · Cisco Catalyst", type: "Preventive", vendor: "NetSecure Ltd.", date: "02 May 2026", status: "Completed" },
  { id: "MNT-217", asset: "MON-0021 · LG Ultrawide", type: "Repair", vendor: "Cloud9 Hardware", date: "28 Apr 2026", status: "Completed" },
];

function tone(s: string) { return s === "Completed" ? "success" : s === "In Progress" ? "warning" : "info"; }

function Maintenance() {
  return (
    <div className="p-8 max-w-[1600px] mx-auto">
      <PageHeader
        title="Maintenance"
        subtitle="Scheduled, in-progress and completed maintenance"
        action={<button className="h-9 px-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium inline-flex items-center gap-1.5"><Plus className="h-4 w-4" />Schedule</button>}
      />
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { l: "Scheduled", v: 12, t: "info" as const },
          { l: "In Progress", v: 5, t: "warning" as const },
          { l: "Completed (30d)", v: 38, t: "success" as const },
        ].map((k) => (
          <Card key={k.l} className="p-5">
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">{k.l}</div>
              <StatusPill tone={k.t}>Live</StatusPill>
            </div>
            <div className="text-2xl font-semibold mt-2">{k.v}</div>
          </Card>
        ))}
      </div>
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
              {["Job", "Asset", "Type", "Vendor", "Date", "Status"].map(h => <th key={h} className="text-left font-medium px-4 py-3">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border hover:bg-muted/30">
                <td className="px-4 py-3 font-mono text-xs">{r.id}</td>
                <td className="px-4 py-3 font-medium">{r.asset}</td>
                <td className="px-4 py-3 text-muted-foreground">{r.type}</td>
                <td className="px-4 py-3">{r.vendor}</td>
                <td className="px-4 py-3 text-muted-foreground inline-flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />{r.date}</td>
                <td className="px-4 py-3"><StatusPill tone={tone(r.status) as any}>{r.status}</StatusPill></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
