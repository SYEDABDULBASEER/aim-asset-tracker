import { formatAppRoleLabel } from "@/lib/auth/roles";
import type { AppRole } from "@/lib/auth/roles";

export function ReadOnlyRoleBanner({
  role,
  scope,
}: {
  role: AppRole | null | undefined;
  /** What the user is viewing, e.g. "employee directory" */
  scope: string;
}) {
  if (!role || role === "admin") return null;

  return (
    <div
      className="mb-4 rounded-lg border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-sm"
      role="status"
    >
      <p className="font-medium text-foreground">Read-only access</p>
      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
        Your role is <span className="font-medium text-foreground">{formatAppRoleLabel(role)}</span>
        . You can view the {scope} but cannot add, edit, or delete records. Contact an administrator
        to change your role.
      </p>
    </div>
  );
}
