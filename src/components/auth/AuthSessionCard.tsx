import { Link } from "@tanstack/react-router";
import { Shield, User } from "lucide-react";
import { Card } from "@/components/ui-kit/Card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/AuthProvider";
import { formatAppRoleLabel, isEndUserRole, isStaffRole } from "@/lib/auth/roles";
import {
  ADMIN_HOME_PATH,
  defaultPathForRole,
  STAFF_LOGIN_PATH,
  USER_LOGIN_PATH,
} from "@/lib/auth/routing";

type AuthSessionCardProps = {
  portal: "staff" | "user";
};

export function AuthSessionCard({ portal }: AuthSessionCardProps) {
  const auth = useAuth();

  if (auth.loading || !auth.user) return null;

  const role = auth.role;
  const email = auth.user.email ?? auth.user.uid;
  const isStaffPortal = portal === "staff";
  const roleMatchesPortal = isStaffPortal ? isStaffRole(role) : isEndUserRole(role);
  const homePath = defaultPathForRole(role);

  return (
    <Card className="mb-6 p-4 border-primary/25 bg-primary/5">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
          {isStaffPortal ? (
            <Shield className="h-5 w-5 text-primary" />
          ) : (
            <User className="h-5 w-5 text-primary" />
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Signed in
            </p>
            <p className="text-sm font-semibold truncate">{email}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Role: <span className="font-medium text-foreground">{formatAppRoleLabel(role)}</span>
              {roleMatchesPortal ? (
                <span className="text-primary"> · matches this portal</span>
              ) : (
                <span className="text-destructive"> · wrong portal for this role</span>
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {roleMatchesPortal ? (
              <Button asChild size="sm">
                <Link to={homePath}>Go to workspace</Link>
              </Button>
            ) : (
              <Button asChild size="sm" variant="secondary">
                <Link to={isStaffRole(role) ? ADMIN_HOME_PATH : defaultPathForRole(role)}>
                  Go to your workspace
                </Link>
              </Button>
            )}
            <Button type="button" size="sm" variant="outline" onClick={() => void auth.signOut()}>
              Sign out
            </Button>
          </div>
          {!roleMatchesPortal && (
            <p className="text-xs text-muted-foreground leading-relaxed">
              {isStaffPortal ? "Employee accounts must use " : "IT accounts must use "}
              <Link
                to={isStaffPortal ? USER_LOGIN_PATH : STAFF_LOGIN_PATH}
                className="text-primary font-medium hover:underline"
              >
                {isStaffPortal ? "user portal sign in" : "admin sign in"}
              </Link>
              .
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
