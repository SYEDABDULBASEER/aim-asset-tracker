import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui-kit/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/auth/AuthProvider";
import { formatAuthFormError } from "@/lib/auth/form-errors";
import { isFirebaseConfigured } from "@/lib/firebase/env";
import {
  ADMIN_HOME_PATH,
  LANDING_PATH,
  roleAllowedOnStaffLogin,
  STAFF_LOGIN_PATH,
  USER_LOGIN_PATH,
} from "@/lib/auth/routing";
import { registerAuthUser } from "@/utils/auth.functions";

type SignupRole = "admin" | "agent";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Create IT staff account — Asset Desk" }] }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<SignupRole>("agent");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (auth.loading || !auth.user) return;
    if (roleAllowedOnStaffLogin(auth.role)) {
      void navigate({ to: ADMIN_HOME_PATH, replace: true });
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
            <Link to="/login">Back to sign in</Link>
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
          role,
        },
      });
      const signedInRole = await auth.signIn(email, password);
      if (!roleAllowedOnStaffLogin(signedInRole)) {
        await auth.refreshRole();
        const refreshed = await auth.refreshRole();
        if (!roleAllowedOnStaffLogin(refreshed)) {
          setError(
            "Account created but IT role is not active yet. Try signing in at IT staff sign in.",
          );
          return;
        }
      }
      void navigate({ to: ADMIN_HOME_PATH });
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
          <h1 className="text-xl font-semibold">Create IT staff account</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            For IT staff only (admin or agent roles). Employees use employee sign-up.
          </p>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-1.5">
            <Label htmlFor="signup-email">Email</Label>
            <Input
              id="signup-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Account type</Label>
            <Select value={role} onValueChange={(value) => setRole(value as SignupRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="agent">Agent</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="signup-password">Password</Label>
            <Input
              id="signup-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={6}
              required
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="signup-confirm-password">Confirm password</Label>
            <Input
              id="signup-confirm-password"
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
          <Link to={STAFF_LOGIN_PATH} className="text-primary hover:underline">
            IT staff sign in
          </Link>
        </p>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Employee?{" "}
          <Link to={USER_LOGIN_PATH} className="text-primary hover:underline">
            Employee sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}
