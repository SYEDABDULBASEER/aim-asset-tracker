import { createFileRoute } from "@tanstack/react-router";
import { Card, PageHeader, StatusPill } from "@/components/ui-kit/Card";
import { TableCard } from "@/components/ui-kit/TableCard";
import { EmptyState } from "@/components/ui-kit/EmptyState";
import { ListPageSkeleton } from "@/components/ui-kit/ListPageSkeleton";
import { PageShell } from "@/components/ui-kit/PageShell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Building2, Pencil, Plus, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth, useAuthQueryEnabled } from "@/lib/auth/AuthProvider";
import type { Vendor } from "@/lib/models";
import { callAuthenticatedServerFn } from "@/lib/auth/authenticated-server-fn";
import { AuthStatusBanner } from "@/components/auth/AuthStatusBanner";
import { ReadOnlyRoleBanner } from "@/components/auth/ReadOnlyRoleBanner";
import { formatListQueryError } from "@/lib/auth/list-query-error";
import { createVendor, deleteVendor, listVendors, updateVendor } from "@/utils/vendors.functions";
import { vendorSlaTone } from "@/lib/ui/status-tones";
import { destructiveAlertActionClass, destructiveIconButtonClass } from "@/lib/ui/button-hierarchy";

export const Route = createFileRoute("/admin/vendors")({
  head: () => ({ meta: [{ title: "Vendors — AssetSphere" }] }),
  component: Vendors,
});

type VendorFormValues = {
  id: string;
  name: string;
  category: string;
  contactEmail: string;
  contracts: string;
  slaPercent: string;
  responseHours: string;
};

function emptyVendorForm(): VendorFormValues {
  return {
    id: "",
    name: "",
    category: "",
    contactEmail: "",
    contracts: "0",
    slaPercent: "95",
    responseHours: "24",
  };
}

function vendorToForm(vendor: Vendor): VendorFormValues {
  return {
    id: vendor.id,
    name: vendor.name,
    category: vendor.category,
    contactEmail: vendor.contactEmail,
    contracts: String(vendor.contracts),
    slaPercent: String(vendor.slaPercent),
    responseHours: String(vendor.responseHours),
  };
}

function Vendors() {
  const auth = useAuth();
  const authReady = useAuthQueryEnabled();
  const queryClient = useQueryClient();
  const isAdmin = auth.role === "admin";
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<VendorFormValues>(emptyVendorForm);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["vendors"],
    queryFn: () => callAuthenticatedServerFn(listVendors, { data: { limit: 100, offset: 0 } }),
    enabled: authReady,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["vendors"] });
  };

  const saveMut = useMutation({
    mutationFn: () => {
      const payload = {
        id: formValues.id.trim(),
        name: formValues.name.trim(),
        category: formValues.category.trim(),
        contactEmail: formValues.contactEmail.trim(),
        contracts: Number(formValues.contracts) || 0,
        slaPercent: Number(formValues.slaPercent) || 0,
        responseHours: Number(formValues.responseHours) || 0,
      };
      if (!payload.id || !payload.name || !payload.contactEmail) {
        throw new Error("ID, name, and contact email are required.");
      }
      return editingId
        ? callAuthenticatedServerFn(updateVendor, { data: payload })
        : callAuthenticatedServerFn(createVendor, { data: payload });
    },
    onSuccess: () => {
      toast.success(editingId ? "Vendor updated" : "Vendor created");
      setDialogOpen(false);
      setEditingId(null);
      setFormValues(emptyVendorForm());
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message ?? "Save failed"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => callAuthenticatedServerFn(deleteVendor, { data: { id } }),
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error("Vendor not found");
        return;
      }
      toast.success("Vendor deleted");
      setDeleteTargetId(null);
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message ?? "Delete failed"),
  });

  const vendors = data?.items ?? [];

  return (
    <PageShell variant="wide">
      <PageHeader
        title="Vendors"
        subtitle={
          isLoading ? "Loading vendors…" : `${data?.total ?? vendors.length} service providers`
        }
        action={
          <Button
            type="button"
            className="h-9 shadow-soft"
            disabled={!isAdmin}
            title={isAdmin ? undefined : "Only administrators can add vendors"}
            onClick={() => {
              setEditingId(null);
              setFormValues(emptyVendorForm());
              setDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Add vendor
          </Button>
        }
      />
      <ReadOnlyRoleBanner role={auth.role} scope="vendor directory" />
      {isLoading ? (
        <ListPageSkeleton rows={6} columns={7} />
      ) : (
        <TableCard scrollLabel="Vendors">
          {isError ? (
            <AuthStatusBanner
              error={formatListQueryError(error)}
              onRetry={() => void refetch()}
              onSignOut={auth.user ? () => void auth.signOut() : undefined}
            />
          ) : null}
          {!isError && vendors.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="No vendors yet"
              description="Add service providers to track SLAs and maintenance partners."
              action={
                isAdmin ? (
                  <Button
                    type="button"
                    className="h-9 shadow-soft"
                    onClick={() => {
                      setEditingId(null);
                      setFormValues(emptyVendorForm());
                      setDialogOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    Add vendor
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  {["Vendor", "Category", "Contact", "Contracts", "SLA", "Response", ""].map(
                    (header) => (
                      <th key={header || "actions"} className="text-left font-medium px-4 py-3">
                        {header}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {vendors.map((vendor) => (
                  <tr key={vendor.id} className="border-t border-border hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{vendor.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{vendor.category}</td>
                    <td className="px-4 py-3 text-muted-foreground">{vendor.contactEmail}</td>
                    <td className="px-4 py-3">{vendor.contracts}</td>
                    <td className="px-4 py-3">
                      <StatusPill tone={vendorSlaTone(vendor.slaPercent)}>
                        {vendor.slaPercent}%
                      </StatusPill>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{vendor.responseHours}h</td>
                    <td className="px-4 py-3">
                      {isAdmin ? (
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => {
                              setEditingId(vendor.id);
                              setFormValues(vendorToForm(vendor));
                              setDialogOpen(true);
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className={`h-7 w-7 ${destructiveIconButtonClass}`}
                            aria-label={`Delete vendor ${vendor.name}`}
                            onClick={() => setDeleteTargetId(vendor.id)}
                            disabled={deleteMut.isPending}
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden />
                          </Button>
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </TableCard>
      )}

      <AlertDialog
        open={deleteTargetId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTargetId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete vendor</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTargetId
                ? `Remove ${deleteTargetId} from the vendor directory. Existing maintenance records are not deleted.`
                : "Remove this vendor from the directory."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMut.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={destructiveAlertActionClass}
              onClick={() => {
                if (deleteTargetId) deleteMut.mutate(deleteTargetId);
              }}
              disabled={deleteMut.isPending || !deleteTargetId}
            >
              Delete vendor
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit vendor" : "Add vendor"}</DialogTitle>
            <DialogDescription>Manage service providers and SLA metadata.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="vendor-id">Vendor ID</Label>
              <Input
                id="vendor-id"
                value={formValues.id}
                readOnly={Boolean(editingId)}
                onChange={(event) =>
                  setFormValues((current) => ({ ...current, id: event.target.value }))
                }
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="vendor-name">Name</Label>
              <Input
                id="vendor-name"
                value={formValues.name}
                onChange={(event) =>
                  setFormValues((current) => ({ ...current, name: event.target.value }))
                }
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="vendor-category">Category</Label>
              <Input
                id="vendor-category"
                value={formValues.category}
                onChange={(event) =>
                  setFormValues((current) => ({ ...current, category: event.target.value }))
                }
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="vendor-email">Contact email</Label>
              <Input
                id="vendor-email"
                type="email"
                value={formValues.contactEmail}
                onChange={(event) =>
                  setFormValues((current) => ({ ...current, contactEmail: event.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="vendor-contracts">Contracts</Label>
                <Input
                  id="vendor-contracts"
                  type="number"
                  min={0}
                  value={formValues.contracts}
                  onChange={(event) =>
                    setFormValues((current) => ({ ...current, contracts: event.target.value }))
                  }
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="vendor-sla">SLA %</Label>
                <Input
                  id="vendor-sla"
                  type="number"
                  min={0}
                  max={100}
                  value={formValues.slaPercent}
                  onChange={(event) =>
                    setFormValues((current) => ({ ...current, slaPercent: event.target.value }))
                  }
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="vendor-response">Response hours</Label>
                <Input
                  id="vendor-response"
                  type="number"
                  min={0}
                  value={formValues.responseHours}
                  onChange={(event) =>
                    setFormValues((current) => ({ ...current, responseHours: event.target.value }))
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
              {editingId ? "Save changes" : "Create vendor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
