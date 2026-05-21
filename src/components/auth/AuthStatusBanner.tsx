import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { STAFF_LOGIN_PATH } from "@/lib/auth/routing";

function normalizeMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Something went wrong.";
}

function isAuthMessage(message: string): boolean {
  const lower = message.toLowerCase();
  return lower.includes("sign in required") || lower.includes("invalid or expired session");
}

export function AuthStatusBanner({
  error,
  onRetry,
  onSignOut,
  className = "",
}: {
  error: unknown;
  onRetry?: () => void;
  onSignOut?: () => void;
  className?: string;
}) {
  const message = normalizeMessage(error);
  const authRelated = isAuthMessage(message);

  return (
    <div
      className={`px-4 py-3 text-sm text-destructive border-b border-border flex flex-wrap items-center gap-3 ${className}`.trim()}
      role="alert"
    >
      <span>{message}</span>
      {authRelated ? (
        <>
          <Button type="button" size="sm" asChild>
            <Link to={STAFF_LOGIN_PATH}>Sign in again</Link>
          </Button>
          {onSignOut ? (
            <Button type="button" size="sm" variant="outline" onClick={onSignOut}>
              Sign out
            </Button>
          ) : null}
        </>
      ) : onRetry ? (
        <Button type="button" size="sm" variant="outline" onClick={onRetry}>
          Retry
        </Button>
      ) : null}
    </div>
  );
}
