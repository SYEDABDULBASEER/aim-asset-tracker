import { Link } from "@tanstack/react-router";
import { Loader2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { STAFF_LOGIN_PATH } from "@/lib/auth/routing";

type AuthScreenProps = {
  /** Shown under the spinner on loading screens */
  message?: string;
  /** When set, sign-in button includes `?redirect=` for post-login navigation */
  redirectTo?: string;
};

export function AuthLoadingScreen({ message = "Checking sign-in…" }: { message?: string }) {
  return (
    <div
      className="min-h-[50vh] flex flex-col items-center justify-center gap-3 text-muted-foreground px-4"
      aria-busy="true"
      aria-live="polite"
    >
      <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
      <p className="text-sm">{message}</p>
    </div>
  );
}

export function AuthRequiredScreen({
  redirectTo,
  message = "Sign in with your IT account to load assets, tickets, and dashboard data.",
}: AuthScreenProps) {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
        <Shield className="h-6 w-6 text-primary" aria-hidden />
      </div>
      <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">{message}</p>
      <Button asChild>
        <Link to={STAFF_LOGIN_PATH} search={redirectTo ? { redirect: redirectTo } : undefined}>
          Sign in — IT staff
        </Link>
      </Button>
    </div>
  );
}

export function AuthRedirectingScreen() {
  return <AuthLoadingScreen message="Redirecting to sign in…" />;
}
