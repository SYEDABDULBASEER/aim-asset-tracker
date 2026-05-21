import { Link } from "@tanstack/react-router";
import { Shield } from "lucide-react";
import { Card } from "@/components/ui-kit/Card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/AuthProvider";
import { formatAppRoleLabel, isStaffRole } from "@/lib/auth/roles";
import { ADMIN_HOME_PATH } from "@/lib/auth/routing";
import { isItStaffAuthEnforced } from "@/lib/auth/it-auth-enforced";

/** Shown on the home page when an IT Firebase session is already active. */
export function LandingStaffSessionStrip() {
  const auth = useAuth();

  if (!isItStaffAuthEnforced() || auth.loading || !auth.user) return null;

  const email = auth.user.email ?? auth.user.uid;
  const role = auth.role;
  const roleOk = isStaffRole(role);

  return (
    <Card className="w-full max-w-lg mb-6 p-4 border-primary/25 bg-primary/5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="h-10 w-10 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Signed in
            </p>
            <p className="text-sm font-semibold truncate">{email}</p>
            <p className="text-xs text-muted-foreground">
              Role: {formatAppRoleLabel(role)}
              {roleOk ? " · IT workspace" : " · not an IT role"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          {roleOk ? (
            <Button asChild size="sm">
              <Link to={ADMIN_HOME_PATH}>Go to IT workspace</Link>
            </Button>
          ) : null}
          <Button type="button" size="sm" variant="outline" onClick={() => void auth.signOut()}>
            Sign out
          </Button>
        </div>
      </div>
    </Card>
  );
}
