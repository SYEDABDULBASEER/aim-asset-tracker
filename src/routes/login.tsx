import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui-kit/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth/AuthProvider";
import { formatAuthFormError } from "@/lib/auth/form-errors";
import {
  ADMIN_HOME_PATH,
  LANDING_PATH,
  roleAllowedOnStaffLogin,
  STAFF_SIGNUP_PATH,
  USER_LOGIN_PATH,
} from "@/lib/auth/routing";
import { isFirebaseConfigured } from "@/lib/firebase/env";

type LoginSearch = { redirect?: string };

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): LoginSearch => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  head: () => ({ meta: [{ title: "IT staff sign in — Asset Desk" }] }),
  component: StaffLoginPage,
});

function StaffLoginPage() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const auth = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const destination = redirect || ADMIN_HOME_PATH;

  useEffect(() => {
    if (auth.loading || !auth.user) return;
    if (roleAllowedOnStaffLogin(auth.role)) {
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
      if (!roleAllowedOnStaffLogin(role)) {
        await auth.signOut();
        setError("This account is an employee account. Use Employee sign in instead.");
        return;
      }
      await navigate({ to: destination });
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
            <h1 className="text-xl font-semibold">IT staff sign in</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Full access to assets, tickets, maintenance, and reports.
            </p>
          </div>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-1.5">
              <Label htmlFor="staff-email">Work email</Label>
              <Input
                id="staff-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="staff-password">Password</Label>
              <Input
                id="staff-password"
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
            <Link to={STAFF_SIGNUP_PATH} className="text-primary hover:underline">
              Create IT staff account
            </Link>
          </p>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Employee?{" "}
            <Link to={USER_LOGIN_PATH} className="text-primary font-medium hover:underline">
              Employee sign in
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
