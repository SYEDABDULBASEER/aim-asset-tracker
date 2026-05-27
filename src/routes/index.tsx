import { createFileRoute, Link } from "@tanstack/react-router";
import { LifeBuoy, LayoutDashboard } from "lucide-react";
import { AppLogo } from "@/components/brand/AppLogo";
import { Card } from "@/components/ui-kit/Card";
import { LandingStaffSessionStrip } from "@/components/auth/LandingStaffSessionStrip";
import { ADMIN_HOME_PATH, STAFF_LOGIN_PATH, USER_HOME_PATH } from "@/lib/auth/routing";
import { AppBrandName } from "@/components/brand/AppBrandName";
import { AppTagline } from "@/components/brand/AppTagline";
import { pageTitle } from "@/lib/branding";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: pageTitle("Home") }] }),
  component: HomeChooserPage,
});

function HomeChooserPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 px-4 py-12">
      <div className="text-center mb-10 max-w-md">
        <AppLogo className="h-16 w-auto max-w-[280px] mx-auto mb-4" />
        <h1 className="text-2xl font-bold tracking-tight">
          <AppBrandName />
        </h1>
        <AppTagline className="mt-2" />
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
          Choose how you want to use the application.
        </p>
      </div>

      <LandingStaffSessionStrip />

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
        <Link
          to={STAFF_LOGIN_PATH}
          search={{ redirect: ADMIN_HOME_PATH }}
          preload="intent"
          className="block group"
        >
          <Card className="p-6 h-full hover:shadow-md transition-all">
            <LayoutDashboard className="h-8 w-8 text-muted-foreground mb-3 group-hover:text-primary transition-colors" />
            <h2 className="text-base font-semibold group-hover:text-primary transition-colors">
              IT admin workspace
            </h2>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              Your operations hub for inventory, service desk, maintenance planning, and analytics —
              secure access for authorized IT staff.
            </p>
          </Card>
        </Link>
      </div>
    </div>
  );
}
