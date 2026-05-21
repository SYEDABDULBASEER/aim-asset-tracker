import { createFileRoute, Link } from "@tanstack/react-router";
import { Boxes } from "lucide-react";
import { ADMIN_HOME_PATH, USER_HOME_PATH } from "@/lib/auth/routing";
import { RaiseTicketForm } from "@/components/user/RaiseTicketForm";

export const Route = createFileRoute("/user/_portal/request-support")({
  head: () => ({ meta: [{ title: "Report an issue — Asset Desk" }] }),
  component: RequestSupportPage,
});

function RequestSupportPage() {
  return (
    <div className="px-4 py-8 max-w-lg mx-auto space-y-8">
      <div className="flex flex-col items-center text-center gap-2">
        <div className="h-12 w-12 rounded-xl bg-primary/15 flex items-center justify-center">
          <Boxes className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Report an issue</h1>
        <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
          Submit a support ticket for IT. Use your work email so you can track status on the portal
          home page.
        </p>
      </div>

      <RaiseTicketForm />

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
    </div>
  );
}
