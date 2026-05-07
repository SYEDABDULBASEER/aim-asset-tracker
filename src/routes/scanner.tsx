import { createFileRoute } from "@tanstack/react-router";
import { Card, PageHeader, StatusPill } from "@/components/ui-kit/Card";
import { QrCode, Camera, Wrench, ArrowLeftRight, Bell, ChevronRight, Smartphone } from "lucide-react";

export const Route = createFileRoute("/scanner")({
  head: () => ({ meta: [{ title: "QR Scanner & Mobile App — Asset Desk" }] }),
  component: ScannerPage,
});

function Phone({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-[260px] h-[540px] rounded-[2.5rem] bg-sidebar p-2 shadow-elevated">
        <div className="w-full h-full rounded-[2rem] bg-background overflow-hidden relative border border-sidebar-border">
          <div className="h-6 flex items-center justify-center">
            <div className="h-1 w-12 bg-sidebar-border rounded-full" />
          </div>
          {children}
        </div>
      </div>
      <div className="mt-3 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function ScannerPage() {
  return (
    <div className="p-8 max-w-[1600px] mx-auto">
      <PageHeader title="QR Scanner & Employee App" subtitle="Scan an asset QR or preview the mobile experience" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="p-6">
          <h3 className="text-sm font-semibold mb-4">Scan Asset QR</h3>
          <div className="relative aspect-square rounded-xl bg-sidebar overflow-hidden flex items-center justify-center">
            <div className="absolute inset-8 border-2 border-white/30 rounded-2xl" />
            <div className="absolute inset-8 rounded-2xl">
              <span className="absolute -top-1 -left-1 h-6 w-6 border-t-2 border-l-2 border-primary rounded-tl-lg" />
              <span className="absolute -top-1 -right-1 h-6 w-6 border-t-2 border-r-2 border-primary rounded-tr-lg" />
              <span className="absolute -bottom-1 -left-1 h-6 w-6 border-b-2 border-l-2 border-primary rounded-bl-lg" />
              <span className="absolute -bottom-1 -right-1 h-6 w-6 border-b-2 border-r-2 border-primary rounded-br-lg" />
            </div>
            <div className="absolute left-8 right-8 top-1/2 h-0.5 bg-primary/80 shadow-[0_0_20px_var(--primary)] animate-pulse" />
            <Camera className="h-10 w-10 text-white/50" />
          </div>
          <p className="text-xs text-muted-foreground text-center mt-4">Align the asset's QR code within the frame</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Last Scanned Asset</h3>
            <StatusPill tone="success">Active</StatusPill>
          </div>
          <div className="flex items-center gap-4 mb-5">
            <div className="h-16 w-16 rounded-xl bg-muted flex items-center justify-center"><QrCode className="h-8 w-8" /></div>
            <div>
              <div className="text-base font-semibold">Dell Latitude 7440</div>
              <div className="text-xs text-muted-foreground font-mono">LAP-0001 · Serial DLN-7440-2398871</div>
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-y-3 text-sm border-t border-border pt-4">
            <dt className="text-muted-foreground text-xs">Owner</dt><dd>Ahmed Khan</dd>
            <dt className="text-muted-foreground text-xs">Department</dt><dd>IT</dd>
            <dt className="text-muted-foreground text-xs">Last Maintenance</dt><dd>12 Mar 2026</dd>
            <dt className="text-muted-foreground text-xs">Warranty</dt><dd>Apr 2027</dd>
          </dl>
          <div className="grid grid-cols-2 gap-2 mt-5">
            <button className="h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium inline-flex items-center justify-center gap-1.5"><Wrench className="h-4 w-4" />Raise Issue</button>
            <button className="h-10 rounded-lg border border-border text-sm font-medium inline-flex items-center justify-center gap-1.5"><ArrowLeftRight className="h-4 w-4" />Transfer</button>
          </div>
        </Card>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <Smartphone className="h-4 w-4" />
        <h2 className="text-sm font-semibold">Employee Mobile App</h2>
      </div>

      <div className="flex flex-wrap gap-6 justify-center">
        <Phone label="Login">
          <div className="px-6 pt-12">
            <div className="h-14 w-14 mx-auto rounded-2xl bg-primary flex items-center justify-center text-primary-foreground font-bold">A</div>
            <h3 className="text-center mt-4 font-semibold">Asset Desk</h3>
            <p className="text-center text-xs text-muted-foreground">Sign in to your workspace</p>
            <div className="mt-6 space-y-3">
              <input placeholder="Work email" className="w-full h-10 px-3 rounded-lg bg-muted text-sm" />
              <input placeholder="Password" type="password" className="w-full h-10 px-3 rounded-lg bg-muted text-sm" />
              <button className="w-full h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium">Sign In</button>
            </div>
          </div>
        </Phone>

        <Phone label="My Assets">
          <div className="px-4 pt-4">
            <div className="text-xs text-muted-foreground">Hello, Ahmed</div>
            <h3 className="font-semibold">My Assets · 4</h3>
            <div className="space-y-2 mt-3">
              {[
                { n: "Dell Latitude 7440", t: "LAP-0001", s: "Active" },
                { n: "iPhone 15 Pro", t: "MOB-0033", s: "Active" },
                { n: "LG Ultrawide 34”", t: "MON-0021", s: "Active" },
                { n: "Logitech MX Master", t: "ACC-0312", s: "Active" },
              ].map((a) => (
                <div key={a.t} className="flex items-center gap-2.5 p-2.5 rounded-lg border border-border">
                  <div className="h-8 w-8 rounded bg-muted flex items-center justify-center"><QrCode className="h-4 w-4" /></div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium truncate">{a.n}</div>
                    <div className="text-[10px] text-muted-foreground font-mono">{a.t}</div>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              ))}
            </div>
          </div>
        </Phone>

        <Phone label="Scan QR">
          <div className="px-4 pt-4">
            <h3 className="font-semibold text-center">Scan Asset</h3>
            <div className="mt-4 aspect-square rounded-2xl bg-sidebar relative overflow-hidden flex items-center justify-center">
              <div className="absolute inset-6 border-2 border-white/40 rounded-xl" />
              <div className="absolute left-6 right-6 top-1/2 h-0.5 bg-primary animate-pulse" />
              <Camera className="h-8 w-8 text-white/60" />
            </div>
            <p className="text-[11px] text-center text-muted-foreground mt-3">Point your camera at the asset's QR</p>
            <button className="mt-3 w-full h-9 rounded-lg border border-border text-xs font-medium">Enter ID manually</button>
          </div>
        </Phone>

        <Phone label="Raise Ticket">
          <div className="px-4 pt-4">
            <h3 className="font-semibold">New Ticket</h3>
            <div className="mt-3 space-y-2.5">
              <div className="text-[10px] uppercase text-muted-foreground">Asset</div>
              <div className="p-2.5 rounded-lg bg-muted text-xs">LAP-0001 · Dell Latitude 7440</div>
              <div className="text-[10px] uppercase text-muted-foreground">Issue</div>
              <textarea className="w-full p-2.5 rounded-lg bg-muted text-xs h-20" placeholder="Describe the issue…" />
              <div className="flex gap-2">
                {["Low", "Medium", "High", "Critical"].map((p, i) => (
                  <span key={p} className={`text-[10px] px-2 py-1 rounded-full ${i === 2 ? "bg-warning/15 text-warning" : "bg-muted text-muted-foreground"}`}>{p}</span>
                ))}
              </div>
              <button className="w-full h-9 rounded-lg bg-primary text-primary-foreground text-xs font-medium">Submit Ticket</button>
            </div>
          </div>
        </Phone>

        <Phone label="Notifications">
          <div className="px-4 pt-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Notifications</h3>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-3 space-y-2">
              {[
                { t: "Ticket #TKT-1031 updated", d: "Sarah is working on your laptop", time: "2m" },
                { t: "Maintenance scheduled", d: "Friday, 2:00 PM · IT Workshop", time: "1h" },
                { t: "Warranty expiring soon", d: "Dell Latitude — 30 days left", time: "1d" },
                { t: "Asset transferred", d: "Monitor moved to Design dept", time: "2d" },
              ].map((n, i) => (
                <div key={i} className="p-2.5 rounded-lg border border-border">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-medium">{n.t}</div>
                    <span className="text-[10px] text-muted-foreground">{n.time}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{n.d}</div>
                </div>
              ))}
            </div>
          </div>
        </Phone>
      </div>
    </div>
  );
}
