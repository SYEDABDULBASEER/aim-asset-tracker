import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Boxes, Home, LifeBuoy } from "lucide-react";
import { USER_HOME_PATH, USER_REQUEST_SUPPORT_PATH } from "@/lib/auth/routing";
import { usePortalRequester } from "@/components/user/PortalRequesterProvider";

const navItems = [
  { title: "My portal", to: USER_HOME_PATH, icon: Home },
  { title: "New ticket", to: USER_REQUEST_SUPPORT_PATH, icon: LifeBuoy },
] as const;

export function UserShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { email, name, deskNumber, hasIdentity } = usePortalRequester();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="h-16 shrink-0 border-b border-border bg-card flex items-center justify-between px-6">
        <Link to={USER_HOME_PATH} preload="intent" className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-primary/15 flex items-center justify-center">
            <Boxes className="h-5 w-5 text-primary" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold">Employee Support</div>
            <div className="text-[11px] text-muted-foreground">Raise & track tickets</div>
          </div>
        </Link>
        {hasIdentity ? (
          <div className="text-right leading-tight hidden sm:block">
            <div className="text-xs font-medium">{name || "Employee"}</div>
            <div className="text-[10px] text-muted-foreground truncate max-w-[200px]">{email}</div>
            {deskNumber ? (
              <div className="text-[10px] text-muted-foreground">Desk {deskNumber}</div>
            ) : null}
          </div>
        ) : null}
      </header>
      <nav className="border-b border-border bg-muted/30 px-6 py-2 flex gap-2">
        {navItems.map((item) => {
          const active =
            item.to === USER_HOME_PATH
              ? pathname === USER_HOME_PATH || pathname === `${USER_HOME_PATH}/`
              : pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              preload="intent"
              className={[
                "inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
                active
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              ].join(" ")}
            >
              <item.icon className="h-3.5 w-3.5" />
              {item.title}
            </Link>
          );
        })}
      </nav>
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
