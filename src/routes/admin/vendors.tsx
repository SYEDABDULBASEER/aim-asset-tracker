import { createFileRoute } from "@tanstack/react-router";
import { Card, PageHeader, StatusPill } from "@/components/ui-kit/Card";
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
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/AuthProvider";
import type { Vendor } from "@/lib/models";
import { callAuthenticatedServerFn } from "@/lib/auth/authenticated-server-fn";
import { createVendor, deleteVendor, listVendors, updateVendor } from "@/utils/vendors.functions";

export const Route = createFileRoute("/admin/vendors")({
  head: () => ({ meta: [{ title: "Vendors — Asset Desk" }] }),
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
  const queryClient = useQueryClient();
  const isAdmin = auth.role === "admin";
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<VendorFormValues>(emptyVendorForm);

  const { data, isLoading } = useQuery({
    queryKey: ["vendors"],
    queryFn: () => callAuthenticatedServerFn(listVendors, { data: { limit: 100, offset: 0 } }),
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
      return editingId ? updateVendor({ data: payload }) : createVendor({ data: payload });
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
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message ?? "Delete failed"),
  });

  const vendors = data?.items ?? [];

  return (
    <div className="p-8 max-w-[1600px] mx-auto">
      <PageHeader
        title="Vendors"
        subtitle={
          isLoading ? "Loading vendors…" : `${data?.total ?? vendors.length} service providers`
        }
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
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
              {["Vendor", "Category", "Contact", "Contracts", "SLA", "Response", ""].map((header) => (
                <th key={header || "actions"} className="text-left font-medium px-4 py-3">
                  {header}
                </th>
              ))}
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
                  <StatusPill
                    tone={
                      vendor.slaPercent >= 95
                        ? "success"
                        : vendor.slaPercent >= 85
                          ? "info"
                          : "warning"
                    }
                  >
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
                        className="h-7 w-7"
                        onClick={() => deleteMut.mutate(vendor.id)}
                        disabled={deleteMut.isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

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
                onChange={(event) => setFormValues((current) => ({ ...current, id: event.target.value }))}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="vendor-name">Name</Label>
              <Input
                id="vendor-name"
                value={formValues.name}
                onChange={(event) => setFormValues((current) => ({ ...current, name: event.target.value }))}
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
    </div>
  );
}
