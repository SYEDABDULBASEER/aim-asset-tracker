import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth/AuthProvider";
import {
  ADMIN_HOME_PATH,
  STAFF_LOGIN_PATH,
  USER_HOME_PATH,
  USER_LOGIN_PATH,
} from "@/lib/auth/routing";
import { isStaffRole } from "@/lib/auth/roles";
import { firebaseAuthRequired } from "@/lib/firebase/env";

type WorkspaceRoleGuardProps = {
  workspace: "staff" | "employee";
  children: ReactNode;
};

/** Keeps IT workspace for staff roles only and employee portal for user role only. */
export function WorkspaceRoleGuard({ workspace, children }: WorkspaceRoleGuardProps) {
  const auth = useAuth();
  const navigate = useNavigate();
  const enforced = firebaseAuthRequired();

  useEffect(() => {
    if (!enforced || auth.loading) return;

    if (!auth.user) {
      void navigate({
        to: workspace === "staff" ? STAFF_LOGIN_PATH : USER_LOGIN_PATH,
        replace: true,
      });
      return;
    }

    if (workspace === "staff" && !isStaffRole(auth.role)) {
      void navigate({ to: USER_HOME_PATH, replace: true });
      return;
    }

    if (workspace === "employee" && auth.role !== "user") {
      void navigate({ to: ADMIN_HOME_PATH, replace: true });
    }
  }, [enforced, auth.loading, auth.user, auth.role, workspace, navigate]);

  if (enforced && auth.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        Checking access…
      </div>
    );
  }

  if (enforced && !auth.user) {
    return null;
  }

  if (enforced && workspace === "staff" && auth.user && !isStaffRole(auth.role)) {
    return null;
  }

  if (enforced && workspace === "employee" && auth.user && auth.role !== "user") {
    return null;
  }

  return children;
}
