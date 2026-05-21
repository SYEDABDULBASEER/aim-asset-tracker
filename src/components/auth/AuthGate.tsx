import { useEffect } from "react";
import { Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";

import { useAuth } from "@/lib/auth/AuthProvider";
import { staffWorkspaceAuthRequired } from "@/lib/auth/staff-workspace-auth";
import { isPublicFullPagePath, isUserPortalPath, STAFF_LOGIN_PATH } from "@/lib/auth/routing";

export function AuthGate() {
  const auth = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const protect = staffWorkspaceAuthRequired();

  useEffect(() => {
    if (!protect) return;
    if (auth.loading) return;
    if (auth.user) return;
    if (isPublicFullPagePath(pathname)) return;
    /** Employee portal does not use Firebase — only the IT workspace requires sign-in. */
    if (isUserPortalPath(pathname)) return;

    void navigate({ to: STAFF_LOGIN_PATH, replace: true });
  }, [protect, auth.loading, auth.user, pathname, navigate]);

  if (protect && auth.loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-label="Loading" />
      </div>
    );
  }

  if (
    protect &&
    !auth.user &&
    !isPublicFullPagePath(pathname) &&
    !isUserPortalPath(pathname)
  ) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-label="Redirecting" />
      </div>
    );
  }

  return <Outlet />;
}
