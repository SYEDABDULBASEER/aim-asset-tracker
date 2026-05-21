import { createFileRoute } from "@tanstack/react-router";
import { WorkspaceRoleGuard } from "@/components/auth/WorkspaceRoleGuard";
import { PortalRequesterProvider } from "@/components/user/PortalRequesterProvider";
import { UserShell } from "@/components/layout/UserShell";

export const Route = createFileRoute("/user/_portal")({
  component: EmployeePortalLayout,
});

function EmployeePortalLayout() {
  return (
    <WorkspaceRoleGuard workspace="employee">
      <PortalRequesterProvider>
        <UserShell />
      </PortalRequesterProvider>
    </WorkspaceRoleGuard>
  );
}
