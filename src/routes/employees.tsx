import { createFileRoute } from "@tanstack/react-router";
import { Card, PageHeader } from "@/components/ui-kit/Card";

export const Route = createFileRoute("/employees")({
  head: () => ({ meta: [{ title: "Employees — Asset Desk" }] }),
  component: Employees,
});

const employees = [
  { name: "Ahmed Khan", role: "IT Manager", dept: "IT", assets: 4, email: "ahmed@eclicktech.com" },
  { name: "Sarah Ali", role: "Senior Designer", dept: "Design", assets: 3, email: "sarah@eclicktech.com" },
  { name: "Mohammed Faisal", role: "Sales Lead", dept: "Sales", assets: 2, email: "faisal@eclicktech.com" },
  { name: "Priya Sharma", role: "Marketing Manager", dept: "Marketing", assets: 3, email: "priya@eclicktech.com" },
  { name: "David Mathew", role: "Operations Head", dept: "Operations", assets: 2, email: "david@eclicktech.com" },
];

function Employees() {
  return (
    <div className="p-8 max-w-[1600px] mx-auto">
      <PageHeader title="Employees" subtitle="412 employees · 6 departments" />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {employees.map((e) => (
          <Card key={e.email} className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-chart-5 text-white text-sm font-semibold flex items-center justify-center">
              {e.name.split(" ").map(s => s[0]).join("")}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold">{e.name}</div>
              <div className="text-xs text-muted-foreground">{e.role} · {e.dept}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5 truncate">{e.email}</div>
            </div>
            <div className="text-right">
              <div className="text-xl font-semibold">{e.assets}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">assets</div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
