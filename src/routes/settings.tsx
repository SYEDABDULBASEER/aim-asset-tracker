import { createFileRoute } from "@tanstack/react-router";
import { Card, PageHeader } from "@/components/ui-kit/Card";
import { Shield, Bell, Clock, Tags, Building2, MapPin, FileSearch, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — Asset Desk" }] }),
  component: Settings,
});

const sections = [
  { icon: Shield, title: "User Roles & Permissions", desc: "Define who can manage assets, tickets and vendors" },
  { icon: Clock, title: "SLA Settings", desc: "Configure response and resolution targets per priority" },
  { icon: Bell, title: "Notification Settings", desc: "Email, in-app and webhook notifications" },
  { icon: Tags, title: "Asset Categories", desc: "Manage categories, sub-categories and custom fields" },
  { icon: Building2, title: "Vendor Management", desc: "Add vendors, contracts and rate cards" },
  { icon: MapPin, title: "Branch Locations", desc: "Configure offices, floors and storage rooms" },
  { icon: FileSearch, title: "Audit Logs", desc: "Immutable history of all actions in the system" },
];

function Settings() {
  return (
    <div className="p-8 max-w-[1100px] mx-auto">
      <PageHeader title="Settings" subtitle="Configure your Asset Desk workspace" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((s) => (
          <Card key={s.title} className="p-5 flex items-center gap-4 hover:shadow-elevated cursor-pointer transition">
            <div className="h-11 w-11 rounded-lg bg-accent flex items-center justify-center">
              <s.icon className="h-5 w-5 text-accent-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold">{s.title}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.desc}</div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Card>
        ))}
      </div>
    </div>
  );
}
