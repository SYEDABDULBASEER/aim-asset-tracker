import { createFileRoute, Outlet } from "@tanstack/react-router";
import { WorkspaceRoleGuard } from "@/components/auth/WorkspaceRoleGuard";
import { AppShell } from "@/components/layout/AppShell";

export const Route = createFileRoute("/admin")({
  component: AdminWorkspaceLayout,
});

function AdminWorkspaceLayout() {
  return (
    <WorkspaceRoleGuard workspace="staff">
      <AppShell />
    </WorkspaceRoleGuard>
  );
}
