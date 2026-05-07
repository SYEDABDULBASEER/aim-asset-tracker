import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, PageHeader, StatusPill } from "@/components/ui-kit/Card";
import { Search, Filter, Download, Plus, Upload, QrCode, MoreHorizontal } from "lucide-react";

export const Route = createFileRoute("/assets")({
  head: () => ({ meta: [{ title: "Assets — Asset Desk" }] }),
  component: AssetsPage,
});

const assets = [
  { id: "LAP-0001", name: "Dell Latitude 7440", category: "Laptop", to: "Ahmed Khan", dept: "IT", status: "Active", warranty: "Apr 2027", service: "12 Mar 2026" },
  { id: "MON-0021", name: "LG Ultrawide 34”", category: "Monitor", to: "Sarah Ali", dept: "Design", status: "Active", warranty: "Jan 2028", service: "—" },
  { id: "PRT-0102", name: "HP LaserJet Pro", category: "Printer", to: "Finance Dept", dept: "Shared", status: "In Repair", warranty: "Aug 2026", service: "02 May 2026" },
  { id: "MOB-0033", name: "iPhone 15 Pro", category: "Mobile", to: "Mohammed Faisal", dept: "Sales", status: "Active", warranty: "Sep 2026", service: "—" },
  { id: "NET-0044", name: "Cisco Catalyst 9300", category: "Network", to: "IT Server Room", dept: "IT", status: "Active", warranty: "Dec 2029", service: "11 Feb 2026" },
  { id: "LAP-0085", name: "MacBook Pro 14”", category: "Laptop", to: "Priya Sharma", dept: "Marketing", status: "Available", warranty: "Jul 2027", service: "—" },
  { id: "MON-0044", name: "Dell U2723QE", category: "Monitor", to: "—", dept: "Stock", status: "Available", warranty: "May 2027", service: "—" },
  { id: "LAP-0212", name: "ThinkPad X1 Carbon", category: "Laptop", to: "—", dept: "—", status: "Retired", warranty: "Expired", service: "21 Jan 2025" },
  { id: "MOB-0099", name: "Samsung Galaxy S24", category: "Mobile", to: "David Mathew", dept: "Operations", status: "Lost", warranty: "Jun 2026", service: "—" },
];

function tone(s: string) {
  return s === "Active" ? "success"
    : s === "In Repair" ? "warning"
    : s === "Available" ? "info"
    : s === "Lost" ? "danger" : "muted";
}

function AssetsPage() {
  return (
    <div className="p-8 max-w-[1600px] mx-auto">
      <PageHeader
        title="Assets"
        subtitle="1,284 total assets across 6 departments"
        action={
          <div className="flex items-center gap-2">
            <button className="h-9 px-3 rounded-lg border border-border bg-card text-sm font-medium hover:bg-muted inline-flex items-center gap-1.5"><Upload className="h-4 w-4" />Bulk Upload</button>
            <button className="h-9 px-3 rounded-lg border border-border bg-card text-sm font-medium hover:bg-muted inline-flex items-center gap-1.5"><Download className="h-4 w-4" />Export</button>
            <button className="h-9 px-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium inline-flex items-center gap-1.5 shadow-soft hover:opacity-90"><Plus className="h-4 w-4" />Add Asset</button>
          </div>
        }
      />

      <Card className="p-4 mb-4">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input placeholder="Search by ID, name, employee…" className="w-full h-9 pl-9 pr-3 rounded-lg bg-muted text-sm focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring/30" />
          </div>
          {["Category", "Department", "Status", "Warranty"].map((f) => (
            <button key={f} className="h-9 px-3 rounded-lg border border-border bg-card text-sm inline-flex items-center gap-1.5 hover:bg-muted">
              <Filter className="h-3.5 w-3.5" /> {f}
            </button>
          ))}
        </div>
      </Card>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
              <th className="text-left font-medium px-4 py-3"><input type="checkbox" className="accent-[var(--primary)]" /></th>
              <th className="text-left font-medium px-4 py-3">Asset ID</th>
              <th className="text-left font-medium px-4 py-3">Asset Name</th>
              <th className="text-left font-medium px-4 py-3">Category</th>
              <th className="text-left font-medium px-4 py-3">Assigned To</th>
              <th className="text-left font-medium px-4 py-3">Department</th>
              <th className="text-left font-medium px-4 py-3">Status</th>
              <th className="text-left font-medium px-4 py-3">Warranty</th>
              <th className="text-left font-medium px-4 py-3">Last Service</th>
              <th className="text-left font-medium px-4 py-3">QR</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {assets.map((a) => (
              <tr key={a.id} className="border-t border-border hover:bg-muted/30 transition">
                <td className="px-4 py-3"><input type="checkbox" className="accent-[var(--primary)]" /></td>
                <td className="px-4 py-3 font-medium">
                  <Link to="/assets/$id" params={{ id: a.id }} className="text-primary hover:underline">{a.id}</Link>
                </td>
                <td className="px-4 py-3">{a.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{a.category}</td>
                <td className="px-4 py-3">{a.to}</td>
                <td className="px-4 py-3 text-muted-foreground">{a.dept}</td>
                <td className="px-4 py-3"><StatusPill tone={tone(a.status) as any}>{a.status}</StatusPill></td>
                <td className="px-4 py-3 text-muted-foreground">{a.warranty}</td>
                <td className="px-4 py-3 text-muted-foreground">{a.service}</td>
                <td className="px-4 py-3"><div className="h-7 w-7 rounded bg-muted flex items-center justify-center"><QrCode className="h-3.5 w-3.5" /></div></td>
                <td className="px-4 py-3"><button className="h-7 w-7 rounded hover:bg-muted flex items-center justify-center"><MoreHorizontal className="h-4 w-4 text-muted-foreground" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-center justify-between px-4 py-3 border-t border-border text-xs text-muted-foreground">
          <span>Showing 1–9 of 1,284</span>
          <div className="flex items-center gap-1">
            <button className="h-7 px-2 rounded border border-border hover:bg-muted">Prev</button>
            <button className="h-7 w-7 rounded bg-primary text-primary-foreground">1</button>
            <button className="h-7 w-7 rounded hover:bg-muted">2</button>
            <button className="h-7 w-7 rounded hover:bg-muted">3</button>
            <button className="h-7 px-2 rounded border border-border hover:bg-muted">Next</button>
          </div>
        </div>
      </Card>
    </div>
  );
}
