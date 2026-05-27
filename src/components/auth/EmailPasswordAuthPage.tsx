import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { AppLogo } from "@/components/brand/AppLogo";
import { useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui-kit/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth/AuthProvider";
import { formatAuthFormError } from "@/lib/auth/form-errors";
import { LANDING_PATH, resolveStaffLoginRedirect } from "@/lib/auth/routing";
import { AppBrandName } from "@/components/brand/AppBrandName";
import { AppTagline } from "@/components/brand/AppTagline";
import { AuthSessionCard } from "@/components/auth/AuthSessionCard";

/** IT staff sign-in only. The employee portal does not use accounts. */
export function StaffLoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const search = useSearch({ strict: false });
  const redirect = typeof search.redirect === "string" ? search.redirect : undefined;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!email.trim() || !password) return;

    setBusy(true);
    try {
      await auth.signIn(email, password);
      toast.success("Signed in");
      await navigate({ to: resolveStaffLoginRedirect(redirect), replace: true });
    } catch (error) {
      const raw = error instanceof Error ? error.message : "Authentication failed.";
      toast.error(formatAuthFormError(raw));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main
      id="main-content"
      className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-muted/40 to-background px-4 py-12"
    >
      <Link
        to={LANDING_PATH}
        className="flex flex-col items-center gap-3 mb-8 hover:opacity-90 transition-opacity text-center"
      >
        <AppLogo className="h-14 w-auto max-w-[min(100%,280px)]" />
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            <AppBrandName />
          </h1>
          <AppTagline className="max-w-sm" />
        </div>
      </Link>

      <AuthSessionCard />

      <Card className="w-full max-w-md p-6">
        <h2 className="text-lg font-semibold">Sign in — IT staff</h2>

        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="mt-5 space-y-4"
          aria-busy={busy}
          aria-label="IT staff sign in"
        >
          <div className="space-y-1.5">
            <Label htmlFor="auth-email">Email</Label>
            <Input
              id="auth-email"
              type="email"
              autoComplete="email"
              autoFocus
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
          <Button type="submit" className="w-full gap-2" disabled={busy} aria-disabled={busy}>
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                <span>Please wait…</span>
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
    </main>
  );
}

/** @deprecated Use `StaffLoginPage` */
export { StaffLoginPage as EmailPasswordAuthPage };
