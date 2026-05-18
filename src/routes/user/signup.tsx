import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui-kit/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth/AuthProvider";
import { formatAuthFormError } from "@/lib/auth/form-errors";
import { isFirebaseConfigured } from "@/lib/firebase/env";
import { registerAuthUser } from "@/utils/auth.functions";
import {
  LANDING_PATH,
  roleAllowedOnUserLogin,
  STAFF_LOGIN_PATH,
  USER_HOME_PATH,
  USER_LOGIN_PATH,
} from "@/lib/auth/routing";

export const Route = createFileRoute("/user/signup")({
  head: () => ({ meta: [{ title: "Create employee account — Asset Desk" }] }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (auth.loading || !auth.user) return;
    if (roleAllowedOnUserLogin(auth.role)) {
      void navigate({ to: USER_HOME_PATH, replace: true });
    }
  }, [auth.loading, auth.user, auth.role, navigate]);

  if (!isFirebaseConfigured()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md p-6 space-y-4">
          <div>
            <h1 className="text-xl font-semibold">Firebase not configured</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Add the Firebase web config values to <code>.env</code> before creating accounts.
            </p>
          </div>
          <Button asChild variant="outline" className="w-full">
            <Link to="/user/login">Back to sign in</Link>
          </Button>
        </Card>
      </div>
    );
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      await registerAuthUser({
        data: {
          email: email.trim(),
          password,
          role: "user",
        },
      });
      const role = await auth.signIn(email, password);
      if (!roleAllowedOnUserLogin(role)) {
        const refreshed = await auth.refreshRole();
        if (!roleAllowedOnUserLogin(refreshed)) {
          throw new Error(
            "Account created but employee role is not active yet. Sign in again in a moment.",
          );
        }
      }
      void navigate({ to: USER_HOME_PATH });
    } catch (submitError) {
      const rawMessage =
        submitError instanceof Error ? submitError.message : "Registration failed. Try again.";
      setError(formatAuthFormError(rawMessage));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md p-6">
        <div className="mb-6">
          <h1 className="text-xl font-semibold">Create employee account</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            For the employee portal only — raise tickets and track status.
          </p>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-1.5">
            <Label htmlFor="user-signup-email">Email</Label>
            <Input
              id="user-signup-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="user-signup-password">Password</Label>
            <Input
              id="user-signup-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={6}
              required
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="user-signup-confirm-password">Confirm password</Label>
            <Input
              id="user-signup-confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              minLength={6}
              required
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Creating account…" : "Create account"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to={USER_LOGIN_PATH} className="text-primary hover:underline">
            Employee sign in
          </Link>
        </p>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          IT staff?{" "}
          <Link to={STAFF_LOGIN_PATH} className="text-primary hover:underline">
            IT staff sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}
