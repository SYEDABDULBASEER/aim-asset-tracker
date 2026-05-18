import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Loader2, Ticket } from "lucide-react";
import { Card, StatusPill } from "@/components/ui-kit/Card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/AuthProvider";
import { ticketStatusTone } from "@/lib/tickets/user-portal";
import { USER_REQUEST_SUPPORT_PATH } from "@/lib/auth/routing";
import { callAuthenticatedServerFn } from "@/lib/auth/authenticated-server-fn";
import { listMyUserTickets } from "@/utils/tickets.functions";

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
  const auth = useAuth();
  const canFetch = !auth.loading && Boolean(auth.user);

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["my-user-tickets", auth.user?.uid],
    queryFn: () => callAuthenticatedServerFn(listMyUserTickets),
    enabled: canFetch,
    refetchInterval: 30_000,
    staleTime: 15_000,
    retry: 1,
  });

  const items = data?.items ?? [];

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
            <Ticket className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">My requests</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Track status of tickets you submitted. Updates refresh automatically.
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 text-xs"
          disabled={isFetching || !canFetch}
          onClick={() => void refetch()}
        >
          {isFetching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Refresh"}
        </Button>
      </div>

      {auth.loading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Checking sign-in…
        </div>
      ) : !auth.user ? (
        <p className="text-sm text-muted-foreground py-4">
          <Link to="/user/login" className="text-primary font-medium hover:underline">
            Sign in
          </Link>{" "}
          to see your ticket status here.
        </p>
      ) : isLoading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading your tickets…
        </div>
      ) : isError ? (
        <div className="py-4 space-y-2">
          <p className="text-sm text-destructive">{errorMessage(error)}</p>
          <p className="text-xs text-muted-foreground">
            If this persists, confirm your account has the <strong>user</strong> role (
            <code className="text-[10px]">npm run auth:set-role -- your@email.com user</code>
            ) and that tickets were submitted with the same email as sign-in.
          </p>
          <Button type="button" size="sm" variant="outline" onClick={() => void refetch()}>
            Try again
          </Button>
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">
          No tickets yet.{" "}
          <Link to={USER_REQUEST_SUPPORT_PATH} className="text-primary font-medium hover:underline">
            Report an issue
          </Link>{" "}
          to open your first request (use the same email you sign in with:{" "}
          <span className="font-medium text-foreground">{auth.user.email}</span>).
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border overflow-hidden">
          {items.map((t) => (
            <li key={t.id}>
              <Link
                to="/user/tickets/$id"
                params={{ id: t.id }}
                preload="intent"
                className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 px-4 py-3 hover:bg-muted/50 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{t.title}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 font-mono">{t.id}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <StatusPill tone={ticketStatusTone(t.status)}>{t.status}</StatusPill>
                  <StatusPill tone={priorityTone(t.priority)}>{t.priority}</StatusPill>
                  <span className="text-[11px] text-muted-foreground">
                    Updated {formatDistanceToNow(new Date(t.updatedAt), { addSuffix: true })}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
