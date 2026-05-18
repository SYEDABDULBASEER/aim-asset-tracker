import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, PageHeader } from "@/components/ui-kit/Card";
import { Button } from "@/components/ui/button";
import { UserTicketsPanel } from "@/components/user/UserTicketsPanel";
import { LifeBuoy } from "lucide-react";
import { USER_REQUEST_SUPPORT_PATH } from "@/lib/auth/routing";

export const Route = createFileRoute("/user/_portal/")({
  head: () => ({ meta: [{ title: "Employee Portal — Asset Desk" }] }),
  component: UserPortalPage,
});

function UserPortalPage() {
  return (
    <div className="p-8 max-w-[900px] mx-auto space-y-6">
      <PageHeader title="Employee Portal" subtitle="Raise incidents and track responses with IT." />

      <UserTicketsPanel />

      <Card className="p-6 border-primary/20 bg-primary/5">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
            <LifeBuoy className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold">Report an issue</h2>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Submit a new support ticket. Use the same email as your sign-in so it appears under My
              requests.
            </p>
            <div className="mt-4">
              <Button asChild>
                <Link to={USER_REQUEST_SUPPORT_PATH}>Raise a ticket</Link>
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
