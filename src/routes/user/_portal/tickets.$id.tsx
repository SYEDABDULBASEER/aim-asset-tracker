import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Card, PageHeader, StatusPill } from "@/components/ui-kit/Card";
import { ticketStatusTone } from "@/lib/tickets/user-portal";
import { callAuthenticatedServerFn } from "@/lib/auth/authenticated-server-fn";
import { USER_HOME_PATH } from "@/lib/auth/routing";
import { getMyUserTicket } from "@/utils/tickets.functions";

export const Route = createFileRoute("/user/_portal/tickets/$id")({
  head: ({ params }) => ({ meta: [{ title: `Ticket ${params.id} — Asset Desk` }] }),
  component: UserTicketDetailPage,
});

function UserTicketDetailPage() {
  const { id } = Route.useParams();

  const { data: ticket, isLoading, isError } = useQuery({
    queryKey: ["my-user-ticket", id],
    queryFn: () => callAuthenticatedServerFn(getMyUserTicket, { data: { id } }),
    refetchInterval: 30_000,
  });

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading ticket…
      </div>
    );
  }

  if (isError || !ticket) {
    return (
      <div className="p-8 max-w-lg mx-auto">
        <p className="text-sm text-destructive">Ticket not found or you do not have access.</p>
        <Link to={USER_HOME_PATH} className="text-sm text-primary mt-4 inline-block hover:underline">
          Back to portal
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[720px] mx-auto space-y-6">
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
          <StatusPill tone="info">{ticket.priority}</StatusPill>
        </div>
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
    </div>
  );
}
