import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { LoadingIndicator } from "@/components/ui-kit/LoadingIndicator";
import { Card, PageHeader, StatusPill } from "@/components/ui-kit/Card";
import { PageShell } from "@/components/ui-kit/PageShell";
import { ticketStatusTone } from "@/lib/tickets/user-portal";
import { ticketPriorityTone } from "@/lib/ui/status-tones";
import { callEmployeePortalServerFn } from "@/lib/auth/authenticated-server-fn";
import { USER_HOME_PATH } from "@/lib/auth/routing";
import { getMyUserTicket } from "@/utils/tickets.functions";
import { usePortalRequester } from "@/components/user/PortalRequesterProvider";

export const Route = createFileRoute("/user/_portal/tickets/$id")({
  head: ({ params }) => ({ meta: [{ title: `Ticket ${params.id} — AssetSphere` }] }),
  component: UserTicketDetailPage,
});

function UserTicketDetailPage() {
  const { id } = Route.useParams();
  const { email, name, hasIdentity } = usePortalRequester();

  const {
    data: ticket,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["my-user-ticket", id, email, name],
    queryFn: () =>
      callEmployeePortalServerFn(getMyUserTicket, {
        data: { id, requesterEmail: email, requesterName: name || undefined },
      }),
    enabled: hasIdentity,
    refetchInterval: 30_000,
  });

  if (!hasIdentity) {
    return (
      <PageShell variant="portal">
        <p className="text-sm text-muted-foreground">
          Enter your work email on the{" "}
          <Link to={USER_HOME_PATH} className="text-primary font-medium hover:underline">
            portal home
          </Link>{" "}
          to view this ticket.
        </p>
      </PageShell>
    );
  }

  if (isLoading) {
    return (
      <PageShell variant="portal">
        <LoadingIndicator label="Loading ticket" />
      </PageShell>
    );
  }

  if (isError || !ticket) {
    return (
      <PageShell variant="portal">
        <p className="text-sm text-destructive">Ticket not found or you do not have access.</p>
        <Link
          to={USER_HOME_PATH}
          className="text-sm text-primary mt-4 inline-block hover:underline"
        >
          Back to portal
        </Link>
      </PageShell>
    );
  }

  return (
    <PageShell variant="portal" className="space-y-6">
      <Link
        to={USER_HOME_PATH}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to my requests
      </Link>

      <PageHeader title={ticket.title} subtitle={ticket.id} />

      <Card className="p-5 space-y-4">
        <div className="flex flex-wrap gap-2">
          <StatusPill tone={ticketStatusTone(ticket.status)}>{ticket.status}</StatusPill>
          <StatusPill tone={ticketPriorityTone(ticket.priority)}>{ticket.priority}</StatusPill>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {ticket.status === "Open" && "Your request is in the queue. IT will pick it up soon."}
          {ticket.status === "In Progress" && "IT is actively working on your request."}
          {ticket.status === "Waiting Parts" && "Work is paused until parts or approvals arrive."}
          {ticket.status === "Resolved" &&
            "IT considers this issue fixed. It may be closed shortly."}
          {ticket.status === "Closed" &&
            "This request is complete. Open a new ticket if you need more help."}
        </p>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-muted-foreground text-xs">Opened</dt>
            <dd className="font-medium">{format(new Date(ticket.createdAt), "PPp")}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Last updated</dt>
            <dd className="font-medium">{format(new Date(ticket.updatedAt), "PPp")}</dd>
          </div>
          {ticket.assigneeName ? (
            <div>
              <dt className="text-muted-foreground text-xs">Assigned to</dt>
              <dd className="font-medium">{ticket.assigneeName}</dd>
            </div>
          ) : (
            <div>
              <dt className="text-muted-foreground text-xs">Assigned to</dt>
              <dd className="text-muted-foreground">Not assigned yet</dd>
            </div>
          )}
          {ticket.deskNumber ? (
            <div>
              <dt className="text-muted-foreground text-xs">Desk number</dt>
              <dd className="font-medium">{ticket.deskNumber}</dd>
            </div>
          ) : null}
          {ticket.assetId ? (
            <div>
              <dt className="text-muted-foreground text-xs">Asset</dt>
              <dd className="font-mono text-xs">{ticket.assetId}</dd>
            </div>
          ) : null}
        </dl>
      </Card>

      {ticket.messages.length > 0 ? (
        <Card className="p-5">
          <h2 className="text-sm font-semibold mb-4">Conversation</h2>
          <ul className="space-y-4">
            {ticket.messages.map((msg) => (
              <li key={msg.id} className="rounded-lg border border-border bg-muted/30 p-3">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-medium">{msg.author}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {format(new Date(msg.createdAt), "PPp")}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.body}</p>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {ticket.status === "Closed" ? (
        <p className="text-xs text-muted-foreground">
          This ticket is closed. Open a new request if you need further help.
        </p>
      ) : null}
    </PageShell>
  );
}
