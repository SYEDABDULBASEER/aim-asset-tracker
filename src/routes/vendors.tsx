import { createFileRoute } from "@tanstack/react-router";
import { Card, PageHeader, StatusPill } from "@/components/ui-kit/Card";

export const Route = createFileRoute("/vendors")({
  head: () => ({ meta: [{ title: "Vendors — Asset Desk" }] }),
  component: Vendors,
});

const vendors = [
  { name: "TechCare Services", category: "Laptops & PCs", contact: "ops@techcare.io", contracts: 3, sla: 98 },
  { name: "PrintWorks Co.", category: "Printers & Toner", contact: "support@printworks.co", contracts: 2, sla: 92 },
  { name: "NetSecure Ltd.", category: "Network & Security", contact: "noc@netsecure.com", contracts: 4, sla: 88 },
  { name: "Cloud9 Hardware", category: "Servers & Storage", contact: "sales@cloud9hw.com", contracts: 1, sla: 81 },
];

function Vendors() {
  return (
    <div className="p-8 max-w-[1600px] mx-auto">
      <PageHeader title="Vendors" subtitle="Service providers and procurement partners" />
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
              {["Vendor", "Category", "Contact", "Contracts", "SLA"].map(h => <th key={h} className="text-left font-medium px-4 py-3">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {vendors.map((v) => (
              <tr key={v.name} className="border-t border-border hover:bg-muted/30">
                <td className="px-4 py-3 font-medium">{v.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{v.category}</td>
                <td className="px-4 py-3 text-muted-foreground">{v.contact}</td>
                <td className="px-4 py-3">{v.contracts}</td>
                <td className="px-4 py-3">
                  <StatusPill tone={v.sla >= 95 ? "success" : v.sla >= 85 ? "info" : "warning"}>{v.sla}%</StatusPill>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
