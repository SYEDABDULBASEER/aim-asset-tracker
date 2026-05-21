import { createFileRoute, Link } from "@tanstack/react-router";
import { Boxes, LifeBuoy, LayoutDashboard } from "lucide-react";
import { Card } from "@/components/ui-kit/Card";
import { ADMIN_HOME_PATH, USER_HOME_PATH } from "@/lib/auth/routing";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Asset Desk" }] }),
  component: HomeChooserPage,
});

function HomeChooserPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 px-4 py-12">
      <div className="text-center mb-10 max-w-md">
        <div className="h-14 w-14 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-4">
          <Boxes className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Enterprise Asset Desk</h1>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
          Choose how you want to use the application.
        </p>
      </div>

      <div className="grid gap-4 w-full max-w-lg sm:grid-cols-2">
        <Link to={USER_HOME_PATH} preload="intent" className="block group">
          <Card className="p-6 h-full border-primary/20 hover:border-primary/40 hover:shadow-md transition-all">
            <LifeBuoy className="h-8 w-8 text-primary mb-3" />
            <h2 className="text-base font-semibold group-hover:text-primary transition-colors">
              Employee portal
            </h2>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              Raise support tickets and track status with your work email — stored on this device
              only. The IT workspace requires a separate provisioned account.
            </p>
          </Card>
        </Link>
        <Link to={ADMIN_HOME_PATH} preload="intent" className="block group">
          <Card className="p-6 h-full hover:shadow-md transition-all">
            <LayoutDashboard className="h-8 w-8 text-muted-foreground mb-3 group-hover:text-primary transition-colors" />
            <h2 className="text-base font-semibold group-hover:text-primary transition-colors">
              IT admin workspace
            </h2>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              Manage assets, tickets, maintenance, and reports. Requires IT sign-in at{" "}
              <span className="text-foreground font-medium">/login</span> (Firebase account).
            </p>
          </Card>
        </Link>
      </div>
    </div>
  );
}
