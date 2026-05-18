import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { Boxes, Home, LifeBuoy, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/AuthProvider";
import { formatAppRoleLabel } from "@/lib/auth/roles";
import {
  LANDING_PATH,
  USER_HOME_PATH,
  USER_REQUEST_SUPPORT_PATH,
} from "@/lib/auth/routing";
import { firebaseAuthRequired } from "@/lib/firebase/env";

const navItems = [
  { title: "Home", to: USER_HOME_PATH, icon: Home },
  { title: "Report issue", to: USER_REQUEST_SUPPORT_PATH, icon: LifeBuoy },
] as const;

export function UserShell() {
  const auth = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const displayName = auth.user?.displayName || auth.user?.email || "Employee";
  const showGuest = firebaseAuthRequired() && !auth.user;

  const handleSignOut = async () => {
    if (auth.user) await auth.signOut();
    await navigate({ to: LANDING_PATH });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="h-16 shrink-0 border-b border-border bg-card flex items-center justify-between px-6">
        <Link to={USER_HOME_PATH} preload="intent" className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-primary/15 flex items-center justify-center">
            <Boxes className="h-5 w-5 text-primary" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold">Employee Support</div>
            <div className="text-[11px] text-muted-foreground">EClickTech Solutions</div>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-right leading-tight">
            <div className="text-xs font-medium">{displayName}</div>
            <div className="text-[10px] text-muted-foreground">
              {showGuest ? "Not signed in" : formatAppRoleLabel(auth.role)}
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => void handleSignOut()}
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </Button>
        </div>
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
