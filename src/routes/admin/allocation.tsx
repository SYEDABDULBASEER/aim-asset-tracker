import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, PageHeader, StatusPill } from "@/components/ui-kit/Card";
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
import { Plus } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { TransferStatus } from "@/lib/models";
import { callAuthenticatedServerFn } from "@/lib/auth/authenticated-server-fn";
import { createTransfer, listTransfers, updateTransferStatus } from "@/utils/transfers.functions";
import { listAssets } from "@/utils/assets.functions";

type AllocationSearch = {
  assetId?: string;
};

export const Route = createFileRoute("/admin/allocation")({
  validateSearch: (search: Record<string, unknown>): AllocationSearch => ({
    assetId: typeof search.assetId === "string" ? search.assetId : undefined,
  }),
  head: () => ({ meta: [{ title: "Asset Allocation — Asset Desk" }] }),
  component: Allocation,
});

function tone(status: TransferStatus) {
  const value = status === "Approved" ? "success" : status === "Pending" ? "warning" : "danger";
  return (value satisfies Parameters<typeof StatusPill>[0]["tone"]) ? value : "info";
}

function Allocation() {
  const queryClient = useQueryClient();
  const { assetId: searchAssetId } = Route.useSearch();
  const [createOpen, setCreateOpen] = useState(false);
  const [formAssetId, setFormAssetId] = useState(searchAssetId ?? "");
  const [formFrom, setFormFrom] = useState("");
  const [formTo, setFormTo] = useState("");
  const [formNotes, setFormNotes] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["transfers", searchAssetId],
    queryFn: () =>
      callAuthenticatedServerFn(listTransfers, {
        data: {
          assetId: searchAssetId,
          limit: 200,
          offset: 0,
        },
      }),
  });

  const { data: assetsRes } = useQuery({
    queryKey: ["assets", "pick", "allocation"],
    queryFn: () => callAuthenticatedServerFn(listAssets, { data: { limit: 200, offset: 0 } }),
  });

  const assetMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const asset of assetsRes?.items ?? []) {
      map.set(asset.id, asset.name);
    }
    return map;
  }, [assetsRes?.items]);

  const rows = data?.items ?? [];

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["transfers"] });
    void queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
  };

  const createMut = useMutation({
    mutationFn: () =>
      callAuthenticatedServerFn(createTransfer, {
        data: {
          assetId: formAssetId,
          fromParty: formFrom.trim(),
          toParty: formTo.trim(),
          notes: formNotes.trim() || null,
        },
      }),
    onSuccess: () => {
      toast.success("Transfer request created");
      setCreateOpen(false);
      setFormFrom("");
      setFormTo("");
      setFormNotes("");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message ?? "Create failed"),
  });

  const statusMut = useMutation({
    mutationFn: (payload: { id: string; status: TransferStatus }) =>
      callAuthenticatedServerFn(updateTransferStatus, { data: payload }),
    onSuccess: () => {
      toast.success("Transfer updated");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message ?? "Update failed"),
  });

  return (
    <div className="p-8 max-w-[1600px] mx-auto">
      <PageHeader
        title="Asset Allocation"
        subtitle={
          isLoading ? "Loading transfers…" : `${data?.total ?? rows.length} transfer records`
        }
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
            New transfer
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
              {["Date", "Asset", "From", "To", "Status", "Actions"].map((header) => (
                <th key={header} className="text-left font-medium px-4 py-3">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-border hover:bg-muted/30">
                <td className="px-4 py-3 text-muted-foreground">
                  {format(new Date(row.requestedAt), "dd MMM yyyy")}
                </td>
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
                <td className="px-4 py-3">{row.fromParty}</td>
                <td className="px-4 py-3">{row.toParty}</td>
                <td className="px-4 py-3">
                  <StatusPill tone={tone(row.status)}>{row.status}</StatusPill>
                </td>
                <td className="px-4 py-3">
                  {row.status === "Pending" ? (
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => statusMut.mutate({ id: row.id, status: "Approved" })}
                      >
                        Approve
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => statusMut.mutate({ id: row.id, status: "Rejected" })}
                      >
                        Reject
                      </Button>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New transfer</DialogTitle>
            <DialogDescription>Request custody change for an asset.</DialogDescription>
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
              <Label htmlFor="transfer-from">From</Label>
              <Input
                id="transfer-from"
                value={formFrom}
                onChange={(event) => setFormFrom(event.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="transfer-to">To</Label>
              <Input
                id="transfer-to"
                value={formTo}
                onChange={(event) => setFormTo(event.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="transfer-notes">Notes</Label>
              <Input
                id="transfer-notes"
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
              disabled={!formAssetId || !formFrom.trim() || !formTo.trim() || createMut.isPending}
            >
              Submit request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
