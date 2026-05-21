import { createFileRoute } from "@tanstack/react-router";
import { Card, PageHeader } from "@/components/ui-kit/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Database } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/AuthProvider";
import {
  firebaseAuthRequired,
  getFirebaseWebConfig,
  isFirebaseConfigured,
} from "@/lib/firebase/env";
import type { OrgSettings } from "@/lib/models";
import { callAuthenticatedServerFn } from "@/lib/auth/authenticated-server-fn";
import { seedFirestoreDemoData } from "@/utils/assets.functions";
import { listAuditLogs } from "@/utils/audit.functions";
import {
  getFirebaseSetupStatus,
  getOrgSettings,
  updateOrgSettings,
} from "@/utils/settings.functions";

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
  const { role, user } = useAuth();
  const isAdmin = role === "admin";
  const queryClient = useQueryClient();
  const [seedMessage, setSeedMessage] = useState<string | null>(null);
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
  const firebaseOn = isFirebaseConfigured();
  const authOn = firebaseAuthRequired();
  const projectId = getFirebaseWebConfig()?.projectId;
  const { data: firebaseStatus } = useQuery({
    queryKey: ["firebase-setup-status"],
    queryFn: () => callAuthenticatedServerFn(getFirebaseSetupStatus),
    enabled: firebaseOn,
  });
  const adminSdkOn = firebaseStatus?.adminSdkConfigured === true;
  const { data: orgSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ["org-settings"],
    queryFn: () => callAuthenticatedServerFn(getOrgSettings),
  });

  const { data: auditData, isLoading: auditLoading } = useQuery({
    queryKey: ["audit-logs"],
    queryFn: () => callAuthenticatedServerFn(listAuditLogs, { data: { limit: 100 } }),
  });

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

  const seedMutation = useMutation({
    mutationFn: () => callAuthenticatedServerFn(seedFirestoreDemoData),
    onSuccess: (data) => {
      setSeedMessage(data.message);
      void queryClient.invalidateQueries();
    },
    onError: (error: Error) => {
      setSeedMessage(error.message ?? "Seed failed");
    },
  });

  return (
    <div className="p-8 max-w-[1100px] mx-auto space-y-6">
      <PageHeader title="Settings" subtitle="Configure your Asset Desk workspace" />

      <Card className="p-5 border-primary/20 bg-muted/30">
        <div className="flex items-start gap-4">
          <div className="h-11 w-11 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
            <Database className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold">Firebase (Firestore & Storage)</div>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {firebaseOn
                ? `Project: ${projectId}. Server Admin SDK: ${firebaseStatus === undefined ? "checking…" : adminSdkOn ? "configured" : "missing — add FIREBASE_SERVICE_ACCOUNT_PATH in .env and restart npm run dev"}. Auth: ${authOn ? (user ? `signed in (${role})` : "sign in required for IT workspace") : "demo mode (VITE_ALLOW_DEMO_AUTH)"}.${role === "viewer" ? " Viewer is read-only — use auth:set-role for admin or agent." : ""}`
                : "Firebase env vars are not set. The app uses the in-memory demo store. See FIREBASE_SETUP.md."}
            </p>
            {firebaseOn && adminSdkOn && isAdmin && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={seedMutation.isPending}
                  onClick={() => {
                    setSeedMessage(null);
                    seedMutation.mutate();
                  }}
                >
                  {seedMutation.isPending ? "Seeding…" : "Seed Firestore with demo data"}
                </Button>
                <span className="text-[11px] text-muted-foreground">
                  Seeds assets, tickets, transfers, maintenance, employees, and vendors. Or run{" "}
                  <code className="text-[10px] bg-muted px-1 rounded">npm run seed:firestore</code> in
                  the project folder.
                </span>
              </div>
            )}
            {firebaseOn && adminSdkOn && !isAdmin && (
              <p className="text-xs mt-3 text-muted-foreground leading-relaxed">
                Only <strong>admin</strong> users can seed from this page. Your role is{" "}
                <strong>{role}</strong>. Ask an administrator to run{" "}
                <code className="text-[10px] bg-muted px-1 rounded">npm run auth:set-role -- your@email admin</code>{" "}
                then sign in again, or run{" "}
                <code className="text-[10px] bg-muted px-1 rounded">npm run seed:firestore</code> from
                the terminal.
              </p>
            )}
            {seedMessage && (
              <p className="text-xs mt-2 text-foreground whitespace-pre-wrap">{seedMessage}</p>
            )}
          </div>
        </div>
      </Card>

      <Card className="p-6 space-y-5">
        <div>
          <h3 className="text-sm font-semibold">Organization settings</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Categories, locations, SLA targets, and notification defaults.
          </p>
        </div>
        {settingsLoading ? (
          <p className="text-sm text-muted-foreground">Loading settings…</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="settings-categories">Asset categories</Label>
                <textarea
                  id="settings-categories"
                  value={categoriesText}
                  onChange={(event) => setCategoriesText(event.target.value)}
                  rows={6}
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="settings-locations">Locations</Label>
                <textarea
                  id="settings-locations"
                  value={locationsText}
                  onChange={(event) => setLocationsText(event.target.value)}
                  rows={6}
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
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
              disabled={saveSettingsMut.isPending}
              onClick={() => saveSettingsMut.mutate()}
            >
              {saveSettingsMut.isPending ? "Saving…" : "Save settings"}
            </Button>
          </>
        )}
      </Card>

      <Card className="overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="text-sm font-semibold">Audit logs</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Recent actions across the workspace.
            </p>
          </div>
          {auditLoading ? (
            <p className="px-6 py-4 text-sm text-muted-foreground">Loading audit logs…</p>
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
                {(auditData?.items ?? []).map((entry) => (
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
        </Card>
    </div>
  );
}
