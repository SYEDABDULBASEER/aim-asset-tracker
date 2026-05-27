import { Search, Bell, Loader2, Inbox, LogOut } from "lucide-react";
import { MobileAdminNav } from "@/components/layout/MobileAdminNav";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { useAuth, useAuthQueryEnabled } from "@/lib/auth/AuthProvider";
import { formatAppRoleLabel } from "@/lib/auth/roles";
import { callAuthenticatedServerFn } from "@/lib/auth/authenticated-server-fn";
import { getNotificationFeed, type NotificationFeedItem } from "@/utils/notifications.functions";
import { AppBrandName } from "@/components/brand/AppBrandName";

const NOTIFY_ACK_STORAGE_KEY = "assetdesk.topbarNotificationsAckAt";

function NotificationEntryLink({
  item,
  className,
  onPick,
  children,
}: {
  item: NotificationFeedItem;
  className: string;
  onPick: () => void;
  children: ReactNode;
}) {
  const link = item.link;
  if (!link) {
    return <div className={className}>{children}</div>;
  }
  if (link.to === "/admin/assets/$id") {
    return (
      <Link
        to="/admin/assets/$id"
        params={link.params}
        search={{ q: undefined }}
        preload="intent"
        onClick={onPick}
        className={className}
      >
        {children}
      </Link>
    );
  }
  return (
    <Link to={link.to} preload="intent" onClick={onPick} className={className}>
      {children}
    </Link>
  );
}

function sessionSubtitle(auth: ReturnType<typeof useAuth>): string {
  if (!auth.configured) return "In-memory demo";
  if (!auth.authRequired) return "Demo mode (auth not enforced)";
  if (auth.loading) return "Checking session…";
  if (!auth.user) return "Not signed in";
  const email = auth.user.email ?? auth.user.uid;
  return `${email} · ${formatAppRoleLabel(auth.role)}`;
}

function sessionInitials(auth: ReturnType<typeof useAuth>): string {
  const email = auth.user?.email?.trim();
  if (email) {
    const local = email.split("@")[0] ?? "";
    const parts = local.split(/[._-]+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
    }
    return local.slice(0, 2).toUpperCase() || "IT";
  }
  return "IT";
}

export function Topbar() {
  const auth = useAuth();
  const authReady = useAuthQueryEnabled();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [ackAt, setAckAt] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(NOTIFY_ACK_STORAGE_KEY);
  });

  const {
    data: notifyData,
    isLoading: notifyLoading,
    isError: notifyError,
  } = useQuery({
    queryKey: ["notification-feed"],
    queryFn: () => callAuthenticatedServerFn(getNotificationFeed, { data: { limit: 30 } }),
    enabled: authReady,
    refetchInterval: 60_000,
    staleTime: 45_000,
  });

  const notifyItems = useMemo(() => notifyData?.items ?? [], [notifyData?.items]);

  const unreadCount = useMemo(() => {
    if (!ackAt) return 0;
    const t = new Date(ackAt).getTime();
    if (Number.isNaN(t)) return 0;
    return notifyItems.filter((i) => new Date(i.createdAt).getTime() > t).length;
  }, [notifyItems, ackAt]);

  const markNotificationsSeen = () => {
    const iso = new Date().toISOString();
    try {
      localStorage.setItem(NOTIFY_ACK_STORAGE_KEY, iso);
    } catch {
      /* ignore */
    }
    setAckAt(iso);
  };

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) return;
    const timer = window.setTimeout(() => {
      void navigate({ to: "/admin/assets", search: { q: trimmed } });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [navigate, query]);

  return (
    <header className="h-16 shrink-0 bg-card border-b border-border flex items-center gap-2 sm:gap-4 px-4 sm:px-6">
      <MobileAdminNav />
      <div className="relative flex-1 min-w-0 max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search assets…"
          className="w-full h-10 pl-10 pr-3 rounded-lg bg-muted border border-transparent text-sm focus:bg-card focus:border-border focus:outline-none focus:ring-2 focus:ring-ring/30 transition"
        />
      </div>
      <div className="flex items-center gap-2">
        <Popover
          open={notifyOpen}
          onOpenChange={(open) => {
            setNotifyOpen(open);
            if (open) markNotificationsSeen();
          }}
        >
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="relative h-9 w-9 shrink-0 rounded-lg"
              aria-label="Notifications"
              title="Activity notifications"
            >
              <Bell className="h-4 w-4 text-foreground" />
              {unreadCount > 0 ? (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-[10px] font-semibold text-destructive-foreground flex items-center justify-center ring-2 ring-card">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              ) : null}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-[min(100vw-2rem,22rem)] p-0" sideOffset={8}>
            <div className="border-b border-border px-3 py-2.5">
              <p className="text-sm font-semibold">Notifications</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Recent workspace activity (refreshes every minute).
              </p>
            </div>
            {notifyLoading ? (
              <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading…
              </div>
            ) : notifyError ? (
              <p className="p-4 text-sm text-destructive">Could not load notifications.</p>
            ) : notifyItems.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground text-sm px-4 text-center">
                <Inbox className="h-8 w-8 opacity-50" />
                <span>No recent activity yet.</span>
              </div>
            ) : (
              <ScrollArea className="h-[min(24rem,calc(100vh-10rem))]">
                <ul className="p-1">
                  {notifyItems.map((item) => {
                    const when = formatDistanceToNow(new Date(item.createdAt), { addSuffix: true });
                    const line = `${item.action} · ${item.entityType} ${item.entityId}`;
                    return (
                      <li key={item.id} className="rounded-md hover:bg-muted/80 transition-colors">
                        <NotificationEntryLink
                          item={item}
                          onPick={() => setNotifyOpen(false)}
                          className="block px-3 py-2.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
                        >
                          <span className="text-xs font-medium text-foreground leading-snug block pr-6">
                            {line}
                          </span>
                          <span className="text-[11px] text-muted-foreground mt-0.5 block">
                            {item.actorLabel} · {when}
                          </span>
                        </NotificationEntryLink>
                      </li>
                    );
                  })}
                </ul>
              </ScrollArea>
            )}
            {notifyItems.length > 0 ? (
              <div className="border-t border-border px-2 py-1.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-muted-foreground h-8"
                  onClick={() => {
                    markNotificationsSeen();
                    void navigate({ to: "/admin/settings" });
                    setNotifyOpen(false);
                  }}
                >
                  View full audit log in Settings
                </Button>
              </div>
            ) : null}
          </PopoverContent>
        </Popover>
        <div className="flex items-center gap-1 sm:gap-2 h-9 px-1 sm:px-2 rounded-lg max-w-[280px]">
          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-chart-5 text-white text-xs font-semibold flex items-center justify-center shrink-0">
            {sessionInitials(auth)}
          </div>
          <div className="hidden sm:block text-left leading-tight min-w-0 flex-1">
            <AppBrandName className="text-xs font-medium truncate block" />
            <div className="text-[10px] text-muted-foreground truncate" title={sessionSubtitle(auth)}>
              {sessionSubtitle(auth)}
            </div>
          </div>
          {auth.authRequired && auth.user ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              title="Sign out"
              aria-label="Sign out"
              onClick={() => void auth.signOut()}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
