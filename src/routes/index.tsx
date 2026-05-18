import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { LoginPortalChooser } from "@/components/auth/LoginPortalChooser";
import { useAuth } from "@/lib/auth/AuthProvider";
import { defaultPathForRole, LANDING_PATH } from "@/lib/auth/routing";
import { isStaffRole } from "@/lib/auth/roles";
import { firebaseAuthRequired } from "@/lib/firebase/env";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (auth.loading) return;
    if (!firebaseAuthRequired()) return;
    if (!auth.user) return;

    const dest = defaultPathForRole(auth.role);
    if (dest !== LANDING_PATH) {
      void navigate({ to: dest, replace: true });
    }
  }, [auth.loading, auth.user, auth.role, navigate]);

  if (auth.loading && firebaseAuthRequired()) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        Checking sign-in…
      </div>
    );
  }

  if (firebaseAuthRequired() && auth.user && isStaffRole(auth.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        Opening IT workspace…
      </div>
    );
  }

  if (firebaseAuthRequired() && auth.user && auth.role === "user") {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        Opening employee portal…
      </div>
    );
  }

  if (!firebaseAuthRequired()) {
    return <LoginPortalChooser />;
  }

  if (!auth.user) {
    return <LoginPortalChooser />;
  }

  return null;
}
