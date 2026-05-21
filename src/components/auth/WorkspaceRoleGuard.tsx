import { useEffect, type ReactNode } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";

import { useAuth } from "@/lib/auth/AuthProvider";
import { AuthLoadingScreen, AuthRequiredScreen } from "@/components/auth/AuthScreens";
import { isItStaffAuthEnforced } from "@/lib/auth/it-auth-enforced";
import { defaultPathForRole } from "@/lib/auth/routing";
import { isStaffRole } from "@/lib/auth/roles";

type WorkspaceRoleGuardProps = {
  workspace: "staff" | "employee";
  children: ReactNode;
};

function StaffAuthGate({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (!isItStaffAuthEnforced()) return children;

  /** AuthGate already verified session; avoid a second full-screen loading flash. */
  if (auth.user && auth.sessionReady) return children;

  if (auth.loading) {
    return <AuthLoadingScreen />;
  }

  if (!auth.user) {
    return <AuthRequiredScreen redirectTo={pathname} />;
  }

  return children;
}

export function WorkspaceRoleGuard({ workspace, children }: WorkspaceRoleGuardProps) {
  const auth = useAuth();
  const navigate = useNavigate();

  const guard = isItStaffAuthEnforced();

  useEffect(() => {
    if (!guard) return;
    /** Employees are not signed in; role claims do not apply. */
    if (workspace === "employee") return;
    if (auth.loading || !auth.user) return;

    if (workspace === "staff" && !isStaffRole(auth.role)) {
      void navigate({ to: defaultPathForRole(auth.role), replace: true });
    }
  }, [guard, auth.loading, auth.user, auth.role, workspace, navigate]);

  if (workspace === "staff") {
    return <StaffAuthGate>{children}</StaffAuthGate>;
  }

  return children;
}
