import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, PageHeader, StatusPill } from "@/components/ui-kit/Card";
import {
  ArrowLeftRight, Ticket, Wrench, Archive, QrCode, FileText,
  Calendar, MapPin, User, Tag, ChevronRight,
} from "lucide-react";

export const Route = createFileRoute("/assets/$id")({
  head: () => ({ meta: [{ title: "Asset Detail — Asset Desk" }] }),
  component: AssetDetail,
});

const timeline = [
  { date: "12 Mar 2026", title: "Battery replaced", by: "Vendor: TechCare Services", tone: "info" as const },
  { date: "08 Nov 2025", title: "OS reimaged & joined to domain", by: "IT — Sarah Ali", tone: "muted" as const },
  { date: "21 Aug 2025", title: "Assigned to Ahmed Khan", by: "Asset Desk", tone: "success" as const },
  { date: "14 Aug 2025", title: "Received from vendor", by: "Procurement", tone: "muted" as const },
];

function AssetDetail() {
  const { id } = Route.useParams();
  return (
    <div className="p-8 max-w-[1600px] mx-auto">
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
        <Link to="/assets" className="hover:text-foreground">Assets</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">{id}</span>
      </nav>

      <PageHeader
        title="Dell Latitude 7440"
        subtitle={`${id} · Laptop · Serial DLN-7440-2398871`}
        action={
          <div className="flex items-center gap-2">
            <button className="h-9 px-3 rounded-lg border border-border bg-card text-sm font-medium hover:bg-muted inline-flex items-center gap-1.5"><ArrowLeftRight className="h-4 w-4" />Transfer</button>
            <button className="h-9 px-3 rounded-lg border border-border bg-card text-sm font-medium hover:bg-muted inline-flex items-center gap-1.5"><Wrench className="h-4 w-4" />Schedule Maintenance</button>
            <button className="h-9 px-3 rounded-lg border border-border bg-card text-sm font-medium hover:bg-muted inline-flex items-center gap-1.5"><Archive className="h-4 w-4" />Mark Retired</button>
            <button className="h-9 px-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium inline-flex items-center gap-1.5 shadow-soft"><Ticket className="h-4 w-4" />Raise Ticket</button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <div className="flex gap-6">
              <div className="h-40 w-56 rounded-xl bg-gradient-to-br from-muted to-accent flex items-center justify-center text-muted-foreground text-xs">
                Asset Image
              </div>
              <div className="flex-1 grid grid-cols-2 gap-4 text-sm">
                <Field icon={User} label="Assigned To" value="Ahmed Khan" />
                <Field icon={MapPin} label="Location" value="HQ · Floor 3 · Desk 14" />
                <Field icon={Tag} label="Category" value="Laptop" />
                <Field icon={Calendar} label="Purchase Date" value="14 Aug 2025" />
                <Field icon={Calendar} label="Warranty Until" value="Apr 2027" />
                <Field label="Status" value={<StatusPill tone="success">Active</StatusPill>} />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-sm font-semibold mb-4">Service & Repair History</h3>
            <ol className="relative border-l border-border ml-2">
              {timeline.map((t, i) => (
                <li key={i} className="ml-6 pb-5 last:pb-0">
                  <span className={`absolute -left-1.5 h-3 w-3 rounded-full bg-${t.tone === "success" ? "success" : t.tone === "info" ? "info" : "muted-foreground"} ring-4 ring-card`} style={{ background: t.tone === "success" ? "var(--success)" : t.tone === "info" ? "var(--info)" : "var(--muted-foreground)" }} />
                  <div className="text-xs text-muted-foreground">{t.date}</div>
                  <div className="text-sm font-medium mt-0.5">{t.title}</div>
                  <div className="text-xs text-muted-foreground">{t.by}</div>
                </li>
              ))}
            </ol>
          </Card>

          <Card className="p-6">
            <h3 className="text-sm font-semibold mb-4">Documents</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {["Invoice.pdf", "Warranty.pdf", "Handover.pdf"].map((d) => (
                <div key={d} className="border border-border rounded-lg p-3 flex items-center gap-3 hover:bg-muted/40 transition cursor-pointer">
                  <div className="h-9 w-9 rounded bg-muted flex items-center justify-center"><FileText className="h-4 w-4" /></div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{d}</div>
                    <div className="text-[11px] text-muted-foreground">PDF · 220 KB</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6 text-center">
            <div className="text-xs text-muted-foreground mb-3">Asset QR Code</div>
            <div className="mx-auto h-44 w-44 rounded-xl bg-white border border-border flex items-center justify-center">
              <QrCode className="h-32 w-32 text-foreground" strokeWidth={1.2} />
            </div>
            <div className="mt-3 text-xs font-mono">{id}</div>
            <button className="mt-4 w-full h-9 rounded-lg border border-border text-sm font-medium hover:bg-muted">Download QR</button>
          </Card>

          <Card className="p-6">
            <h3 className="text-sm font-semibold mb-4">Activity Log</h3>
            <ul className="space-y-3 text-sm">
              {["Status updated to Active", "Reassigned from IT Stock", "Maintenance window scheduled"].map((a, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
                  <div>
                    <div>{a}</div>
                    <div className="text-[11px] text-muted-foreground">2 days ago</div>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Field({ icon: Icon, label, value }: { icon?: any; label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
        {Icon && <Icon className="h-3 w-3" />}{label}
      </div>
      <div className="mt-1 font-medium">{value}</div>
    </div>
  );
}
