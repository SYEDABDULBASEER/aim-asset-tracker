import { Link, useNavigate } from "@tanstack/react-router";
import { Boxes, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui-kit/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth/AuthProvider";
import { formatAuthFormError } from "@/lib/auth/form-errors";
import { ADMIN_HOME_PATH, LANDING_PATH } from "@/lib/auth/routing";
import { AuthSessionCard } from "@/components/auth/AuthSessionCard";
import { firebaseAuthRequired } from "@/lib/firebase/env";

/** IT staff sign-in only. The employee portal does not use accounts. */
export function StaffLoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const authRequired = firebaseAuthRequired();

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!email.trim() || !password) return;

    setBusy(true);
    try {
      await auth.signIn(email, password);
      toast.success("Signed in");
      await navigate({ to: ADMIN_HOME_PATH, replace: true });
    } catch (error) {
      const raw = error instanceof Error ? error.message : "Authentication failed.";
      toast.error(formatAuthFormError(raw));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-muted/40 to-background px-4 py-12">
      <Link
        to={LANDING_PATH}
        className="flex items-center gap-2.5 mb-8 hover:opacity-90 transition-opacity"
      >
        <div className="h-11 w-11 rounded-xl bg-primary/15 flex items-center justify-center">
          <Boxes className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Asset Desk</h1>
          <p className="text-sm text-muted-foreground">EClickTech Solutions</p>
        </div>
      </Link>

      <AuthSessionCard />

      <Card className="w-full max-w-md p-6">
        <h2 className="text-lg font-semibold">Sign in — IT staff</h2>

        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
          Only authorized IT accounts can access the workspace. Users are created in Firebase Console
          (or by your administrator); roles are assigned with{" "}
          <code className="text-[11px] bg-muted px-1 rounded">npm run auth:set-role</code>. After a
          role change, use <strong className="font-medium text-foreground">Sign out</strong> then sign
          in again so your session picks up the new role.
        </p>

        {authRequired ? (
          <p className="text-[11px] text-muted-foreground mt-2 rounded-md bg-muted/50 px-2 py-1.5">
            Public sign-up is disabled. Request access from your IT administrator.
          </p>
        ) : (
          <p className="text-[11px] text-amber-900/90 dark:text-amber-100/90 mt-2 rounded-md bg-amber-500/15 px-2 py-1.5">
            Demo / open mode: configure Firebase and enforce auth for production.
          </p>
        )}

        <form onSubmit={(e) => void handleSubmit(e)} className="mt-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="auth-email">Email</Label>
            <Input
              id="auth-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="auth-password">Password</Label>
            <Input
              id="auth-password"
              type="password"
              autoComplete="current-password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full gap-2" disabled={busy}>
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Please wait…
              </>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>

        <p className="text-xs text-center text-muted-foreground mt-4">
          <Link to={LANDING_PATH} className="hover:underline">
            Back to home
          </Link>
        </p>
      </Card>
    </div>
  );
}

/** @deprecated Use `StaffLoginPage` */
export { StaffLoginPage as EmailPasswordAuthPage };
