import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/ui-kit/Card";
import { PageShell } from "@/components/ui-kit/PageShell";
import { PortalIdentityCard } from "@/components/user/PortalIdentityCard";
import { UserTicketsPanel } from "@/components/user/UserTicketsPanel";
import { RaiseTicketForm } from "@/components/user/RaiseTicketForm";
import { usePortalRequester } from "@/components/user/PortalRequesterProvider";

export const Route = createFileRoute("/user/_portal/")({
  head: () => ({ meta: [{ title: "Employee Support Portal — AssetSphere" }] }),
  component: UserPortalPage,
});

function UserPortalPage() {
  const { hasIdentity } = usePortalRequester();

  return (
    <PageShell variant="portal" className="space-y-8">
      <PageHeader
        centered
        title="Employee Support Portal"
        subtitle="Raise IT support tickets with your work email — stored on this device only, not a Firebase IT login."
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
    </PageShell>
  );
}
