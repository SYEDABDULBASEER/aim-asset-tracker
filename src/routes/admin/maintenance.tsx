import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Card, PageHeader, StatusPill } from "@/components/ui-kit/Card";
import { TableCard } from "@/components/ui-kit/TableCard";
import { AssetContextBanner } from "@/components/ui-kit/AssetContextBanner";
import { EmptyState } from "@/components/ui-kit/EmptyState";
import { ListPageSkeleton } from "@/components/ui-kit/ListPageSkeleton";
import { PageShell } from "@/components/ui-kit/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Plus, Wrench } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { MaintenanceStatus, MaintenanceType } from "@/lib/models";
import { callAuthenticatedServerFn } from "@/lib/auth/authenticated-server-fn";
import { useAuth, useAuthQueryEnabled } from "@/lib/auth/AuthProvider";
import { AuthStatusBanner } from "@/components/auth/AuthStatusBanner";
import { formatListQueryError } from "@/lib/auth/list-query-error";
import {
  createMaintenanceJob,
  listMaintenanceJobs,
  updateMaintenanceJob,
} from "@/utils/maintenance.functions";
import { listAssets } from "@/utils/assets.functions";
import { listVendors } from "@/utils/vendors.functions";
import { maintenanceStatusTone } from "@/lib/ui/status-tones";

type MaintenanceSearch = {
  assetId?: string;
};

export const Route = createFileRoute("/admin/maintenance")({
  validateSearch: (search: Record<string, unknown>): MaintenanceSearch => ({
    assetId: typeof search.assetId === "string" ? search.assetId : undefined,
  }),
  head: () => ({ meta: [{ title: "Maintenance — AssetSphere" }] }),
  component: Maintenance,
});

const TYPES: MaintenanceType[] = ["Preventive", "Repair", "Inspection"];

function Maintenance() {
  const auth = useAuth();
  const navigate = useNavigate();
  const authReady = useAuthQueryEnabled();
  const queryClient = useQueryClient();
  const { assetId: searchAssetId } = Route.useSearch();
  const [createOpen, setCreateOpen] = useState(false);
  const [formAssetId, setFormAssetId] = useState(searchAssetId ?? "");
  const [formType, setFormType] = useState<MaintenanceType>("Preventive");
  const [formVendor, setFormVendor] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formNotes, setFormNotes] = useState("");

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["maintenance", searchAssetId],
    queryFn: () =>
      callAuthenticatedServerFn(listMaintenanceJobs, {
        data: {
          assetId: searchAssetId,
          limit: 200,
          offset: 0,
        },
      }),
    enabled: authReady,
  });

  const { data: assetsRes } = useQuery({
    queryKey: ["assets", "pick", "maintenance"],
    queryFn: () => callAuthenticatedServerFn(listAssets, { data: { limit: 200, offset: 0 } }),
  });

  const { data: vendorsRes } = useQuery({
    queryKey: ["vendors", "pick", "maintenance"],
    queryFn: () => callAuthenticatedServerFn(listVendors, { data: { limit: 100, offset: 0 } }),
  });

  const assetMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const asset of assetsRes?.items ?? []) {
      map.set(asset.id, asset.name);
    }
    return map;
  }, [assetsRes?.items]);

  const rows = useMemo(() => data?.items ?? [], [data?.items]);
  const summary = useMemo(() => {
    const scheduled = rows.filter((row) => row.status === "Scheduled").length;
    const inProgress = rows.filter((row) => row.status === "In Progress").length;
    const completed = rows.filter((row) => row.status === "Completed").length;
    return { scheduled, inProgress, completed };
  }, [rows]);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["maintenance"] });
    void queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    void queryClient.invalidateQueries({ queryKey: ["reports-summary"] });
  };

  const createMut = useMutation({
    mutationFn: () =>
      callAuthenticatedServerFn(createMaintenanceJob, {
        data: {
          assetId: formAssetId,
          type: formType,
          vendor: formVendor.trim(),
          scheduledAt: new Date(formDate).toISOString(),
          notes: formNotes.trim() || null,
        },
      }),
    onSuccess: () => {
      toast.success("Maintenance job scheduled");
      setCreateOpen(false);
      setFormNotes("");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message ?? "Create failed"),
  });

  const statusMut = useMutation({
    mutationFn: (payload: { id: string; status: MaintenanceStatus }) =>
      callAuthenticatedServerFn(updateMaintenanceJob, { data: payload }),
    onSuccess: () => {
      toast.success("Maintenance job updated");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message ?? "Update failed"),
  });

  return (
    <PageShell variant="wide">
      <PageHeader
        title="Maintenance"
        subtitle={isLoading ? "Loading jobs…" : `${data?.total ?? rows.length} maintenance jobs`}
        action={
          <Button
            type="button"
            className="h-9 shadow-soft"
            onClick={() => {
              setFormAssetId(searchAssetId ?? "");
              setCreateOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Schedule
          </Button>
        }
      />

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Scheduled", value: summary.scheduled, tone: "info" as const },
          { label: "In Progress", value: summary.inProgress, tone: "warning" as const },
          { label: "Completed", value: summary.completed, tone: "success" as const },
        ].map((card) => (
          <Card key={card.label} className="p-5">
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">{card.label}</div>
              <StatusPill tone={card.tone}>Live</StatusPill>
            </div>
            <div className="text-2xl font-semibold mt-2">{card.value}</div>
          </Card>
        ))}
      </div>

      {searchAssetId ? (
        <AssetContextBanner
          assetId={searchAssetId}
          assetLabel={assetMap.get(searchAssetId)}
          onClear={() => void navigate({ to: "/admin/maintenance", search: { assetId: undefined } })}
        />
      ) : null}

      {isLoading ? (
        <ListPageSkeleton rows={6} columns={7} />
      ) : (
      <TableCard scrollLabel="Maintenance jobs">
        {isError ? (
          <AuthStatusBanner
            error={formatListQueryError(error)}
            onRetry={() => void refetch()}
            onSignOut={auth.user ? () => void auth.signOut() : undefined}
          />
        ) : null}
        {!isError && rows.length === 0 ? (
          <EmptyState
            icon={Wrench}
            title="No maintenance jobs"
            description={
              searchAssetId
                ? "No scheduled or completed work for this asset yet."
                : "Schedule preventive or repair work with your vendor partners."
            }
            action={
              <Button type="button" className="h-9 shadow-soft" onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4" />
                Schedule job
              </Button>
            }
          />
        ) : (
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
              {["Job", "Asset", "Type", "Vendor", "Date", "Status", "Actions"].map((header) => (
                <th key={header} className="text-left font-medium px-4 py-3">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-border hover:bg-muted/30">
                <td className="px-4 py-3 font-mono text-xs">{row.id}</td>
                <td className="px-4 py-3 font-medium">
                  <Link
                    to="/admin/assets/$id"
                    params={{ id: row.assetId }}
                    search={{ q: undefined }}
                    className="text-primary hover:underline"
                  >
                    {row.assetId}
                  </Link>
                  {assetMap.get(row.assetId) ? ` · ${assetMap.get(row.assetId)}` : ""}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{row.type}</td>
                <td className="px-4 py-3">{row.vendor}</td>
                <td className="px-4 py-3 text-muted-foreground inline-flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {format(new Date(row.scheduledAt), "dd MMM yyyy")}
                </td>
                <td className="px-4 py-3">
                  <StatusPill tone={maintenanceStatusTone(row.status)}>{row.status}</StatusPill>
                </td>
                <td className="px-4 py-3">
                  {row.status === "Scheduled" ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => statusMut.mutate({ id: row.id, status: "In Progress" })}
                    >
                      Start
                    </Button>
                  ) : row.status === "In Progress" ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => statusMut.mutate({ id: row.id, status: "Completed" })}
                    >
                      Complete
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </TableCard>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule maintenance</DialogTitle>
            <DialogDescription>Create a maintenance job linked to an asset.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-1.5">
              <Label>Asset</Label>
              <Select value={formAssetId} onValueChange={setFormAssetId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select asset" />
                </SelectTrigger>
                <SelectContent>
                  {(assetsRes?.items ?? []).map((asset) => (
                    <SelectItem key={asset.id} value={asset.id}>
                      {asset.id} — {asset.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Type</Label>
              <Select
                value={formType}
                onValueChange={(value) => setFormType(value as MaintenanceType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Vendor</Label>
              <Select value={formVendor} onValueChange={setFormVendor}>
                <SelectTrigger>
                  <SelectValue placeholder="Select vendor" />
                </SelectTrigger>
                <SelectContent>
                  {(vendorsRes?.items ?? []).map((vendor) => (
                    <SelectItem key={vendor.id} value={vendor.name}>
                      {vendor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="maintenance-date">Scheduled date</Label>
              <Input
                id="maintenance-date"
                type="date"
                value={formDate}
                onChange={(event) => setFormDate(event.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="maintenance-notes">Notes</Label>
              <Input
                id="maintenance-notes"
                value={formNotes}
                onChange={(event) => setFormNotes(event.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => createMut.mutate()}
              disabled={!formAssetId || !formVendor || !formDate || createMut.isPending}
            >
              Schedule job
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
