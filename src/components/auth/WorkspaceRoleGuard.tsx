import { useEffect, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";

import { useAuth } from "@/lib/auth/AuthProvider";
import { firebaseAuthRequired, isFirebaseConfigured } from "@/lib/firebase/env";
import { defaultPathForRole, STAFF_LOGIN_PATH } from "@/lib/auth/routing";
import { isStaffRole } from "@/lib/auth/roles";
import { Button } from "@/components/ui/button";

type WorkspaceRoleGuardProps = {
  workspace: "staff" | "employee";
  children: ReactNode;
};

function StaffAuthGate({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const navigate = useNavigate();
  const guard = isFirebaseConfigured() && firebaseAuthRequired();

  useEffect(() => {
    if (!guard || auth.loading || auth.user) return;
    void navigate({ to: STAFF_LOGIN_PATH, replace: true });
  }, [guard, auth.loading, auth.user, navigate]);

  if (!guard) return children;

  if (auth.loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
        <p className="text-sm">Checking sign-in…</p>
      </div>
    );
  }

  if (!auth.user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-sm text-muted-foreground max-w-sm">
          Sign in with your IT account to load assets, tickets, and dashboard data from Firebase.
        </p>
        <Button asChild>
          <Link to={STAFF_LOGIN_PATH}>Sign in — IT staff</Link>
        </Button>
      </div>
    );
  }

  return children;
}

export function WorkspaceRoleGuard({ workspace, children }: WorkspaceRoleGuardProps) {
  const auth = useAuth();
  const navigate = useNavigate();

  const guard = isFirebaseConfigured() && firebaseAuthRequired();

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
