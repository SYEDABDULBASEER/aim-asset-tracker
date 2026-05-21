import { createFileRoute, Link } from "@tanstack/react-router";
import { Boxes } from "lucide-react";
import { PageHeader } from "@/components/ui-kit/Card";
import { PageShell } from "@/components/ui-kit/PageShell";
import { ADMIN_HOME_PATH, USER_HOME_PATH } from "@/lib/auth/routing";
import { RaiseTicketForm } from "@/components/user/RaiseTicketForm";

export const Route = createFileRoute("/user/_portal/request-support")({
  head: () => ({ meta: [{ title: "Report an issue — Asset Desk" }] }),
  component: RequestSupportPage,
});

function RequestSupportPage() {
  return (
    <PageShell variant="portal" className="space-y-8">
      <div className="flex justify-center">
        <div className="h-12 w-12 rounded-xl bg-primary/15 flex items-center justify-center">
          <Boxes className="h-6 w-6 text-primary" />
        </div>
      </div>
      <PageHeader
        centered
        title="Report an issue"
        subtitle="Follow the steps below: confirm who you are, describe the problem, then submit to the IT queue."
      />

      <RaiseTicketForm showIdentityFields />

      <p className="text-center text-xs text-muted-foreground">
        <Link to={USER_HOME_PATH} className="text-primary font-medium hover:underline">
          Portal home
        </Link>
        {" · "}
        IT staff{" "}
        <Link to={ADMIN_HOME_PATH} className="text-primary font-medium hover:underline">
          admin workspace
        </Link>
      </p>
    </PageShell>
  );
}
