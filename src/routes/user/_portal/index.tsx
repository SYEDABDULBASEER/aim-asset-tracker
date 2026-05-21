import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/ui-kit/Card";
import { PortalIdentityCard } from "@/components/user/PortalIdentityCard";
import { UserTicketsPanel } from "@/components/user/UserTicketsPanel";
import { RaiseTicketForm } from "@/components/user/RaiseTicketForm";
import { usePortalRequester } from "@/components/user/PortalRequesterProvider";
import { firebaseAuthRequired } from "@/lib/firebase/env";

export const Route = createFileRoute("/user/_portal/")({
  head: () => ({ meta: [{ title: "Employee Support Portal — Asset Desk" }] }),
  component: UserPortalPage,
});

function UserPortalPage() {
  const { hasIdentity } = usePortalRequester();

  return (
    <div className="p-6 md:p-8 max-w-[960px] mx-auto space-y-8">
      <PageHeader
        title="Employee Support Portal"
        subtitle={
          firebaseAuthRequired()
            ? "Sign in with your employee account to raise tickets and track your requests."
            : "Raise IT support tickets and track their status in one place — no password required."
        }
      />

      <PortalIdentityCard />

      {hasIdentity ? (
        <>
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground">Raise a new ticket</h2>
            <RaiseTicketForm showIdentityFields={false} />
          </section>

          <section className="space-y-3">
            <UserTicketsPanel />
          </section>
        </>
      ) : null}
    </div>
  );
}
