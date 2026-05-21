import type { AppRole } from "@/lib/auth/roles";
import { formatAppRoleLabel } from "@/lib/auth/roles";

type RowStatus = "ok" | "warn" | "muted" | "off";

function statusClass(status: RowStatus): string {
  if (status === "ok") return "text-success font-medium";
  if (status === "warn") return "text-amber-600 dark:text-amber-400 font-medium";
  if (status === "off") return "text-muted-foreground";
  return "text-foreground";
}

function StatusRow({
  label,
  value,
  status = "muted",
}: {
  label: string;
  value: string;
  status?: RowStatus;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-border last:border-0 text-sm">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className={`text-right leading-snug ${statusClass(status)}`}>{value}</span>
    </div>
  );
}

export function FirebaseStatusRows({
  firebaseOn,
  projectId,
  adminSdkOn,
  adminSdkChecking,
  authOn,
  userEmail,
  role,
}: {
  firebaseOn: boolean;
  projectId?: string;
  adminSdkOn: boolean;
  adminSdkChecking: boolean;
  authOn: boolean;
  userEmail?: string | null;
  role: AppRole | null | undefined;
}) {
  if (!firebaseOn) {
    return (
      <div className="rounded-lg border border-border bg-card/50 px-3">
        <StatusRow label="Backend" value="In-memory demo store" status="off" />
        <StatusRow
          label="Firebase"
          value="Not configured (see FIREBASE_SETUP.md)"
          status="off"
        />
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card/50 px-3">
      <StatusRow label="Firebase project" value={projectId ?? "—"} status="ok" />
      <StatusRow
        label="Server Admin SDK"
        value={
          adminSdkChecking
            ? "Checking…"
            : adminSdkOn
              ? "Configured"
              : "Missing — set FIREBASE_SERVICE_ACCOUNT_PATH in .env"
        }
        status={adminSdkChecking ? "muted" : adminSdkOn ? "ok" : "warn"}
      />
      <StatusRow
        label="IT auth enforcement"
        value={authOn ? "Enabled (Firebase sign-in)" : "Demo mode (VITE_ALLOW_DEMO_AUTH)"}
        status={authOn ? "ok" : "warn"}
      />
      <StatusRow
        label="Signed-in user"
        value={userEmail ?? "Not signed in"}
        status={userEmail ? "ok" : "warn"}
      />
      <StatusRow
        label="Your role"
        value={role ? formatAppRoleLabel(role) : "—"}
        status={role === "admin" ? "ok" : "muted"}
      />
    </div>
  );
}
