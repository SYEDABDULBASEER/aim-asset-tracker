import { createFileRoute } from "@tanstack/react-router";
import { Card, PageHeader } from "@/components/ui-kit/Card";
import { EmptyState } from "@/components/ui-kit/EmptyState";
import { ListPageSkeleton } from "@/components/ui-kit/ListPageSkeleton";
import { TableCard } from "@/components/ui-kit/TableCard";
import { PageShell } from "@/components/ui-kit/PageShell";
import { AuthStatusBanner } from "@/components/auth/AuthStatusBanner";
import { ReadOnlyRoleBanner } from "@/components/auth/ReadOnlyRoleBanner";
import { formatListQueryError } from "@/lib/auth/list-query-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useAuth, useAuthQueryEnabled } from "@/lib/auth/AuthProvider";
import type { OrgSettings } from "@/lib/models";
import { callAuthenticatedServerFn } from "@/lib/auth/authenticated-server-fn";
import { listAuditLogs } from "@/utils/audit.functions";
import { getOrgSettings, updateOrgSettings } from "@/utils/settings.functions";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({ meta: [{ title: "Settings — Asset Desk" }] }),
  component: Settings,
});

function linesToList(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function listToLines(values: string[]) {
  return values.join("\n");
}

function Settings() {
  const auth = useAuth();
  const { role } = auth;
  const authReady = useAuthQueryEnabled();
  const isAdmin = role === "admin";
  const queryClient = useQueryClient();
  const [categoriesText, setCategoriesText] = useState("");
  const [locationsText, setLocationsText] = useState("");
  const [slaHours, setSlaHours] = useState<OrgSettings["slaHoursByPriority"]>({
    Critical: 4,
    High: 24,
    Medium: 72,
    Low: 120,
  });
  const [notifications, setNotifications] = useState<OrgSettings["notifications"]>({
    emailEnabled: false,
    inAppEnabled: true,
    webhookEnabled: false,
  });
  const { data: orgSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ["org-settings"],
    queryFn: () => callAuthenticatedServerFn(getOrgSettings),
    enabled: authReady,
  });

  const {
    data: auditData,
    isLoading: auditLoading,
    isError: auditError,
    error: auditErrorDetail,
    refetch: refetchAudit,
  } = useQuery({
    queryKey: ["audit-logs"],
    queryFn: () => callAuthenticatedServerFn(listAuditLogs, { data: { limit: 100 } }),
    enabled: authReady,
  });

  const auditEntries = auditData?.items ?? [];

  useEffect(() => {
    if (!orgSettings) return;
    setCategoriesText(listToLines(orgSettings.categories));
    setLocationsText(listToLines(orgSettings.locations));
    setSlaHours(orgSettings.slaHoursByPriority);
    setNotifications(orgSettings.notifications);
  }, [orgSettings]);

  const saveSettingsMut = useMutation({
    mutationFn: () =>
      callAuthenticatedServerFn(updateOrgSettings, {
        data: {
          categories: linesToList(categoriesText),
          locations: linesToList(locationsText),
          slaHoursByPriority: slaHours,
          notifications,
        },
      }),
    onSuccess: () => {
      toast.success("Settings saved");
      void queryClient.invalidateQueries({ queryKey: ["org-settings"] });
    },
    onError: (error: Error) => toast.error(error.message ?? "Save failed"),
  });

  return (
    <PageShell variant="narrow" className="space-y-6">
      <PageHeader title="Settings" subtitle="Configure your Asset Desk workspace" />

      <Card className="p-6 space-y-5">
        <div>
          <h3 className="text-sm font-semibold">Organization settings</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Categories, locations, SLA targets, and notification defaults.
          </p>
        </div>
        <ReadOnlyRoleBanner role={role} scope="organization settings" />
        {settingsLoading ? (
          <p className="text-sm text-muted-foreground">Loading settings…</p>
        ) : (
          <fieldset disabled={!isAdmin} className="space-y-5 border-0 p-0 m-0 min-w-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="settings-categories">Asset categories</Label>
                <textarea
                  id="settings-categories"
                  value={categoriesText}
                  onChange={(event) => setCategoriesText(event.target.value)}
                  rows={6}
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm disabled:opacity-60"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="settings-locations">Locations</Label>
                <textarea
                  id="settings-locations"
                  value={locationsText}
                  onChange={(event) => setLocationsText(event.target.value)}
                  rows={6}
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm disabled:opacity-60"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(["Critical", "High", "Medium", "Low"] as const).map((priority) => (
                <div key={priority} className="grid gap-1.5">
                  <Label htmlFor={`sla-${priority}`}>{priority} SLA (hours)</Label>
                  <Input
                    id={`sla-${priority}`}
                    type="number"
                    min={1}
                    value={slaHours[priority]}
                    onChange={(event) =>
                      setSlaHours((current) => ({
                        ...current,
                        [priority]: Number(event.target.value) || 1,
                      }))
                    }
                  />
                </div>
              ))}
            </div>
            <div className="grid gap-3">
              {(
                [
                  ["emailEnabled", "Email notifications"],
                  ["inAppEnabled", "In-app notifications"],
                  ["webhookEnabled", "Webhook notifications"],
                ] as const
              ).map(([key, label]) => (
                <div
                  key={key}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                >
                  <Label htmlFor={`notify-${key}`}>{label}</Label>
                  <Switch
                    id={`notify-${key}`}
                    checked={notifications[key]}
                    onCheckedChange={(checked) =>
                      setNotifications((current) => ({ ...current, [key]: checked }))
                    }
                  />
                </div>
              ))}
            </div>
            <Button
              type="button"
              disabled={saveSettingsMut.isPending || !isAdmin}
              title={isAdmin ? undefined : "Only administrators can save organization settings"}
              onClick={() => saveSettingsMut.mutate()}
            >
              {saveSettingsMut.isPending ? "Saving…" : "Save settings"}
            </Button>
          </fieldset>
        )}
      </Card>

      <TableCard scrollLabel="Audit log entries">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="text-sm font-semibold">Audit logs</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Recent actions across the workspace.
            </p>
          </div>
          {auditLoading ? (
            <ListPageSkeleton rows={5} columns={4} className="border-0 shadow-none rounded-none" />
          ) : auditError ? (
            <AuthStatusBanner
              error={formatListQueryError(auditErrorDetail)}
              onRetry={() => void refetchAudit()}
              onSignOut={auth.user ? () => void auth.signOut() : undefined}
            />
          ) : auditEntries.length === 0 ? (
            <EmptyState
              title="No audit entries yet"
              description="Workspace actions will appear here after assets, tickets, or settings change."
            />
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="text-left font-medium px-4 py-3">When</th>
                  <th className="text-left font-medium px-4 py-3">Action</th>
                  <th className="text-left font-medium px-4 py-3">Entity</th>
                  <th className="text-left font-medium px-4 py-3">Actor</th>
                </tr>
              </thead>
              <tbody>
                {auditEntries.map((entry) => (
                  <tr key={entry.id} className="border-t border-border">
                    <td className="px-4 py-3 text-muted-foreground">
                      {format(new Date(entry.createdAt), "dd MMM yyyy HH:mm")}
                    </td>
                    <td className="px-4 py-3">{entry.action}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {entry.entityType} · {entry.entityId}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {entry.actorEmail ?? entry.actorUid}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </TableCard>
    </PageShell>
  );
}
