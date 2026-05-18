import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui-kit/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth/AuthProvider";
import { formatAuthFormError } from "@/lib/auth/form-errors";
import { isStaffRole } from "@/lib/auth/roles";
import {
  LANDING_PATH,
  roleAllowedOnUserLogin,
  STAFF_LOGIN_PATH,
  USER_HOME_PATH,
  USER_SIGNUP_PATH,
} from "@/lib/auth/routing";
import { isFirebaseConfigured } from "@/lib/firebase/env";

type LoginSearch = { redirect?: string };

export const Route = createFileRoute("/user/login")({
  validateSearch: (search: Record<string, unknown>): LoginSearch => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  head: () => ({ meta: [{ title: "Employee sign in — Asset Desk" }] }),
  component: EmployeeLoginPage,
});

function EmployeeLoginPage() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const auth = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const destination = redirect || USER_HOME_PATH;

  useEffect(() => {
    if (auth.loading || !auth.user) return;
    if (roleAllowedOnUserLogin(auth.role)) {
      void navigate({ to: destination, replace: true });
    }
  }, [auth.loading, auth.user, auth.role, navigate, destination]);

  if (!isFirebaseConfigured()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md p-6">
          <p className="text-sm text-muted-foreground">
            Configure Firebase in <code>.env</code> to enable sign-in.
          </p>
          <Button asChild className="mt-4 w-full" variant="outline">
            <Link to={LANDING_PATH}>Back</Link>
          </Button>
        </Card>
      </div>
    );
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const role = await auth.signIn(email, password);
      if (!roleAllowedOnUserLogin(role)) {
        await auth.signOut();
        setError(
          isStaffRole(role)
            ? "This account is for IT staff. Use IT staff sign in instead."
            : "This account does not have employee portal access. Ask IT to assign the user role, or create an employee account below.",
        );
        return;
      }
      void navigate({ to: destination });
    } catch (submitError) {
      setError(
        formatAuthFormError(
          submitError instanceof Error ? submitError.message : "Sign-in failed. Try again.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <p className="text-center text-xs text-muted-foreground mb-4">
          <Link to={LANDING_PATH} className="hover:text-foreground">
            ← Back to sign-in options
          </Link>
        </p>
        <Card className="p-6">
          <div className="mb-6 text-center">
            <h1 className="text-xl font-semibold">Employee sign in</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Raise tickets and track status. No IT admin access.
            </p>
          </div>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-1.5">
              <Label htmlFor="user-login-email">Work email</Label>
              <Input
                id="user-login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="user-login-password">Password</Label>
              <Input
                id="user-login-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Signing in…" : "Sign in"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Need an account?{" "}
            <Link to={USER_SIGNUP_PATH} className="text-primary hover:underline">
              Create employee account
            </Link>
          </p>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            IT staff?{" "}
            <Link to={STAFF_LOGIN_PATH} className="text-primary font-medium hover:underline">
              IT staff sign in
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
