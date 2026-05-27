import { useEffect } from "react";
import { Outlet, useNavigate, useRouterState } from "@tanstack/react-router";

import { useAuth } from "@/lib/auth/AuthProvider";
import {
  AuthLoadingScreen,
  AuthRedirectingScreen,
  AuthRequiredScreen,
} from "@/components/auth/AuthScreens";
import { isItStaffAuthEnforced } from "@/lib/auth/it-auth-enforced";
import { isPublicFullPagePath, isUserPortalPath, STAFF_LOGIN_PATH } from "@/lib/auth/routing";

export function AuthGate() {
  const auth = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const protect = isItStaffAuthEnforced();
  const isPublicOrPortal = isPublicFullPagePath(pathname) || isUserPortalPath(pathname);

  useEffect(() => {
    if (!protect) return;
    if (auth.loading) return;
    if (auth.user) return;
    if (isPublicOrPortal) return;

    void navigate({
      to: STAFF_LOGIN_PATH,
      search: { redirect: pathname },
      replace: true,
    });
  }, [protect, auth.loading, auth.user, isPublicOrPortal, pathname, navigate]);

  if (protect && auth.loading) {
    return <AuthLoadingScreen />;
  }

  if (protect && !auth.user && !isPublicOrPortal) {
    return <AuthRedirectingScreen />;
  }

  return <Outlet />;
}
