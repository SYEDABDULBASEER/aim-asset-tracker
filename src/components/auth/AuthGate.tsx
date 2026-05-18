import { useEffect } from "react";
import { Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth/AuthProvider";
import { isStaffRole } from "@/lib/auth/roles";
import { firebaseAuthRequired } from "@/lib/firebase/env";
import {
  ADMIN_HOME_PATH,
  isPublicFullPagePath,
  isStaffWorkspacePath,
  isUserPortalPath,
  STAFF_LOGIN_PATH,
  USER_HOME_PATH,
  USER_LOGIN_PATH,
} from "@/lib/auth/routing";

/**
 * Global auth redirects. Two logins only:
 * - IT staff → /login → /admin (full workspace)
 * - Employee → /user/login → /user (tickets only)
 */
export function AuthGate() {
  const auth = useAuth();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const navigate = useNavigate();
  const firebaseRequired = firebaseAuthRequired();
  const isPublicRoute = isPublicFullPagePath(pathname);
  const isUserPortal = isUserPortalPath(pathname);
  const isStaffWorkspace = isStaffWorkspacePath(pathname);

  useEffect(() => {
    if (auth.loading || !firebaseRequired) return;

    if (!auth.user) {
      // Allow landing, /login, /signup, /user/login, /user/signup without redirecting.
      if (isPublicFullPagePath(pathname)) return;
      if (isUserPortal) void navigate({ to: USER_LOGIN_PATH, replace: true });
      else void navigate({ to: STAFF_LOGIN_PATH, replace: true });
      return;
    }

    if (isUserPortal && auth.role === "user") return;
    if (isStaffWorkspace && isStaffRole(auth.role)) return;

    if (isUserPortal && isStaffRole(auth.role)) {
      void navigate({ to: ADMIN_HOME_PATH, replace: true });
      return;
    }
    if (isStaffWorkspace && auth.role === "user") {
      void navigate({ to: USER_HOME_PATH, replace: true });
    }
  }, [
    firebaseRequired,
    auth.loading,
    auth.user,
    auth.role,
    pathname,
    navigate,
    isUserPortal,
    isStaffWorkspace,
  ]);

  if (isPublicRoute) {
    return <Outlet />;
  }

  if (firebaseRequired && auth.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        Checking sign-in…
      </div>
    );
  }

  if (firebaseRequired && !auth.user) {
    return null;
  }

  return <Outlet />;
}
