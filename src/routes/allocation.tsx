import { createFileRoute } from "@tanstack/react-router";
import { Card, PageHeader, StatusPill } from "@/components/ui-kit/Card";

export const Route = createFileRoute("/allocation")({
  head: () => ({ meta: [{ title: "Asset Allocation — Asset Desk" }] }),
  component: Allocation,
});

const rows = [
  { date: "06 May 2026", asset: "LAP-0001 · Dell Latitude 7440", from: "IT Stock", to: "Ahmed Khan", status: "Approved" },
  { date: "05 May 2026", asset: "MON-0021 · LG Ultrawide 34”", from: "IT Stock", to: "Sarah Ali", status: "Approved" },
  { date: "04 May 2026", asset: "MOB-0099 · Samsung Galaxy S24", from: "Mohammed Faisal", to: "David Mathew", status: "Pending" },
  { date: "02 May 2026", asset: "PRT-0102 · HP LaserJet Pro", from: "HR", to: "Finance", status: "Approved" },
  { date: "30 Apr 2026", asset: "LAP-0212 · ThinkPad X1", from: "Stock", to: "Priya Sharma", status: "Rejected" },
];

function tone(s: string) { return s === "Approved" ? "success" : s === "Pending" ? "warning" : "danger"; }

function Allocation() {
  return (
    <div className="p-8 max-w-[1600px] mx-auto">
      <PageHeader title="Asset Allocation" subtitle="Transfer requests and assignment history" />
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
              {["Date", "Asset", "From", "To", "Status"].map(h => <th key={h} className="text-left font-medium px-4 py-3">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-border hover:bg-muted/30">
                <td className="px-4 py-3 text-muted-foreground">{r.date}</td>
                <td className="px-4 py-3 font-medium">{r.asset}</td>
                <td className="px-4 py-3">{r.from}</td>
                <td className="px-4 py-3">{r.to}</td>
                <td className="px-4 py-3"><StatusPill tone={tone(r.status) as any}>{r.status}</StatusPill></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
