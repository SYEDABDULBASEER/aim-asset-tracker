import { Link } from "@tanstack/react-router";
import { Shield } from "lucide-react";
import { Card } from "@/components/ui-kit/Card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/AuthProvider";
import { formatAppRoleLabel, isEndUserRole, isStaffRole } from "@/lib/auth/roles";
import { ADMIN_HOME_PATH, defaultPathForRole, STAFF_LOGIN_PATH } from "@/lib/auth/routing";

/** Shown on the IT login page when a Firebase session already exists */
export function AuthSessionCard() {
  const auth = useAuth();

  if (auth.loading || !auth.user) return null;

  const role = auth.role;
  const email = auth.user.email ?? auth.user.uid;
  const roleOk = isStaffRole(role);
  const homePath = defaultPathForRole(role);

  return (
    <Card className="mb-6 p-4 border-primary/25 bg-primary/5">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Signed in
            </p>
            <p className="text-sm font-semibold truncate">{email}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Role: <span className="font-medium text-foreground">{formatAppRoleLabel(role)}</span>
              {roleOk ? (
                <span className="text-primary"> · IT workspace</span>
              ) : (
                <span className="text-destructive"> · not an IT role</span>
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {roleOk ? (
              <Button asChild size="sm">
                <Link to={ADMIN_HOME_PATH}>Go to IT workspace</Link>
              </Button>
            ) : (
              <Button asChild size="sm" variant="secondary">
                <Link to={homePath}>{isEndUserRole(role) ? "Go to your workspace" : "Home"}</Link>
              </Button>
            )}
            <Button type="button" size="sm" variant="outline" onClick={() => void auth.signOut()}>
              Sign out
            </Button>
          </div>
          {!roleOk && (
            <p className="text-xs text-muted-foreground leading-relaxed">
              IT accounts must use{" "}
              <Link to={STAFF_LOGIN_PATH} className="text-primary font-medium hover:underline">
                IT sign in
              </Link>
              .
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
