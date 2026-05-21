import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Loader2, Ticket, ArrowRight } from "lucide-react";
import { Card, StatusPill } from "@/components/ui-kit/Card";
import { Button } from "@/components/ui/button";
import { ticketStatusTone } from "@/lib/tickets/user-portal";
import { USER_REQUEST_SUPPORT_PATH } from "@/lib/auth/routing";
import { callEmployeePortalServerFn } from "@/lib/auth/authenticated-server-fn";
import { listMyUserTickets } from "@/utils/tickets.functions";
import { usePortalRequester } from "@/components/user/PortalRequesterProvider";

function priorityTone(p: string): "danger" | "warning" | "info" | "muted" {
  if (p === "Critical") return "danger";
  if (p === "High") return "warning";
  if (p === "Medium") return "info";
  return "muted";
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Could not load your tickets.";
}

export function UserTicketsPanel() {
  const { email, name, hasIdentity } = usePortalRequester();

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["my-user-tickets", email, name],
    queryFn: () =>
      callEmployeePortalServerFn(listMyUserTickets, {
        data: { requesterEmail: email, requesterName: name || undefined },
      }),
    enabled: hasIdentity,
    refetchInterval: 30_000,
    staleTime: 15_000,
    retry: 1,
  });

  const items = data?.items ?? [];

  if (!hasIdentity) {
    return (
      <Card className="p-6 border border-dashed border-border/60 rounded-2xl bg-muted/10">
        <p className="text-sm text-muted-foreground text-center py-4">
          Enter your work email above to see tickets you have raised.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6 border border-border/60 shadow-sm rounded-2xl">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="flex items-start gap-3 min-w-0">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 shadow-sm">
            <Ticket className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">My support requests</h2>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Status updates for tickets submitted with <span className="font-medium">{email}</span>.
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 text-xs shadow-sm hover:bg-muted/80"
          disabled={isFetching}
          onClick={() => void refetch()}
        >
          {isFetching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Refresh"}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground font-medium">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          Loading your tickets…
        </div>
      ) : isError ? (
        <div className="py-4 space-y-2">
          <p className="text-sm text-destructive">{errorMessage(error)}</p>
          <Button type="button" size="sm" variant="outline" onClick={() => void refetch()}>
            Try again
          </Button>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-border/40 rounded-xl bg-muted/5">
          <p className="text-sm text-muted-foreground">
            No support requests yet for this email.{" "}
            <Link to={USER_REQUEST_SUPPORT_PATH} className="text-primary font-semibold hover:underline">
              Raise a ticket
            </Link>{" "}
            to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((t) => (
            <div
              key={t.id}
              className="relative overflow-hidden rounded-xl border border-border/50 hover:border-primary/30 bg-card hover:bg-muted/10 shadow-sm hover:shadow transition-all duration-300 group"
            >
              <div
                className={`absolute left-0 top-0 bottom-0 w-1 ${
                  t.priority === "Critical"
                    ? "bg-rose-500"
                    : t.priority === "High"
                      ? "bg-amber-500"
                      : t.priority === "Medium"
                        ? "bg-blue-500"
                        : "bg-zinc-400"
                }`}
              />
              <Link
                to="/user/tickets/$id"
                params={{ id: t.id }}
                preload="intent"
                className="flex items-center justify-between gap-4 px-5 py-4"
              >
                <div className="min-w-0 flex-1 pl-1">
                  <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                    {t.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1.5 text-[11px] text-muted-foreground font-mono">
                    <span className="font-bold text-muted-foreground/90 uppercase">{t.id}</span>
                    <span>•</span>
                    <span>updated {formatDistanceToNow(new Date(t.updatedAt), { addSuffix: true })}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex gap-2">
                    <StatusPill tone={priorityTone(t.priority)}>{t.priority}</StatusPill>
                    <StatusPill tone={ticketStatusTone(t.status)}>{t.status}</StatusPill>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground/60 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
