import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { Card, PageHeader } from "@/components/ui-kit/Card";
import { EmptyState } from "@/components/ui-kit/EmptyState";
import { PageShell } from "@/components/ui-kit/PageShell";
import { Button } from "@/components/ui/button";
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
import {
  ArrowLeftRight,
  Ticket,
  Wrench,
  QrCode,
  FileText,
  ChevronRight,
  Pencil,
  Trash2,
  ImageIcon,
  Upload,
  type LucideIcon,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { callAuthenticatedServerFn } from "@/lib/auth/authenticated-server-fn";
import { useIsAdmin } from "@/lib/auth/AuthProvider";
import { destructiveAlertActionClass, destructiveIconButtonClass } from "@/lib/ui/button-hierarchy";
import { isFirebaseConfigured } from "@/lib/firebase/env";
import { listAssetDocuments, uploadAssetDocument } from "@/lib/firebase/asset-documents.storage";
import { format } from "date-fns";
import {
  deleteAsset,
  getAssetById,
  getAssetQrPayload,
  updateAsset,
} from "@/utils/assets.functions";
import { listAuditLogs } from "@/utils/audit.functions";
import {
  AssetFormDialog,
  assetToFormValues,
  type AssetFormValues,
} from "@/components/assets/AssetFormDialog";
import { getAssetSpecificationLines } from "@/lib/book1-inventory";

export const Route = createFileRoute("/admin/assets/$id")({
  head: () => ({ meta: [{ title: "Asset Detail — AssetSphere" }] }),
  component: AssetDetail,
});

function toNullable(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function toNullableDate(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function formatDateLabel(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return format(date, "dd MMM yyyy");
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function AssetDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [formValues, setFormValues] = useState<AssetFormValues>(assetToFormValues());
  const uploadRef = useRef<HTMLInputElement>(null);
  const isAdmin = useIsAdmin();
  const storageEnabled = isFirebaseConfigured();

  const { data: asset, isLoading } = useQuery({
    queryKey: ["asset", id],
    queryFn: () => callAuthenticatedServerFn(getAssetById, { data: { id } }),
  });

  const { data: qrPayload } = useQuery({
    queryKey: ["asset-qr", id],
    queryFn: () => callAuthenticatedServerFn(getAssetQrPayload, { data: { id } }),
    enabled: Boolean(asset),
  });

  const {
    data: documents = [],
    isLoading: documentsLoading,
    refetch: refetchDocuments,
  } = useQuery({
    queryKey: ["asset-documents", id],
    queryFn: () => listAssetDocuments(id),
    enabled: storageEnabled,
  });

  const { data: auditData, isLoading: auditLoading } = useQuery({
    queryKey: ["asset-audit", id],
    queryFn: () => callAuthenticatedServerFn(listAuditLogs, { data: { entityId: id, limit: 50 } }),
    enabled: Boolean(asset),
  });

  const auditEntries = auditData?.items ?? [];

  const uploadDocumentMut = useMutation({
    mutationFn: (file: File) => uploadAssetDocument(id, file),
    onSuccess: () => {
      toast.success("Document uploaded");
      void refetchDocuments();
    },
    onError: (error: Error) => toast.error(error.message ?? "Upload failed"),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["asset", id] });
    void queryClient.invalidateQueries({ queryKey: ["assets"] });
    void queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
  };

  const updateMut = useMutation({
    mutationFn: () =>
      callAuthenticatedServerFn(updateAsset, {
        data: {
          id,
          name: formValues.name.trim(),
          category: formValues.category,
          status: formValues.status,
          assignedTo: toNullable(formValues.assignedTo),
          department: toNullable(formValues.department),
          warrantyUntil: toNullableDate(formValues.warrantyUntil),
          lastServiceAt: toNullableDate(formValues.lastServiceAt),
          serial: toNullable(formValues.serial),
          location: toNullable(formValues.location),
          purchaseDate: toNullableDate(formValues.purchaseDate),
          specifications: toNullable(formValues.specifications),
        },
      }),
    onSuccess: () => {
      toast.success("Asset updated");
      setEditOpen(false);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message ?? "Update failed"),
  });

  const deleteMut = useMutation({
    mutationFn: () => callAuthenticatedServerFn(deleteAsset, { data: { id } }),
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error("Asset not found");
        return;
      }
      toast.success("Asset deleted");
      void navigate({ to: "/admin/assets", search: { q: undefined } });
    },
    onError: (e: Error) => toast.error(e.message ?? "Delete failed"),
  });

  const qrImageUrl = useMemo(() => {
    if (!qrPayload?.payload) return null;
    const encoded = encodeURIComponent(qrPayload.payload);
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encoded}`;
  }, [qrPayload?.payload]);

  if (!isLoading && !asset) {
    throw notFound();
  }

  return (
    <PageShell variant="wide">
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
        <Link to="/admin/assets" search={{ q: undefined }} className="hover:text-foreground">
          Assets
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">{id}</span>
      </nav>

      <PageHeader
        title={isLoading ? "Loading…" : (asset?.name ?? "Asset not found")}
        subtitle={isLoading ? id : (asset?.id ?? id)}
        action={
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" className="h-9">
              <Link to="/admin/allocation" search={{ assetId: id }}>
                <ArrowLeftRight className="h-4 w-4" />
                Transfer
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-9">
              <Link to="/admin/maintenance" search={{ assetId: id }}>
                <Wrench className="h-4 w-4" />
                Schedule Maintenance
              </Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-9"
              onClick={() => {
                if (!asset) return;
                setFormValues(assetToFormValues(asset));
                setEditOpen(true);
              }}
            >
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
            {isAdmin ? (
              <Button
                type="button"
                variant="outline"
                className={`h-9 ${destructiveIconButtonClass}`}
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="h-4 w-4" aria-hidden />
                Delete asset
              </Button>
            ) : null}
            <Button asChild className="h-9 shadow-soft">
              <Link to="/admin/tickets" search={{ assetId: id }}>
                <Ticket className="h-4 w-4" />
                Raise Ticket
              </Link>
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="h-40 w-full sm:w-56 shrink-0 rounded-xl border border-dashed border-border bg-muted/30 overflow-hidden">
                {storageEnabled ? (
                  <EmptyState
                    icon={ImageIcon}
                    title="No photo yet"
                    description="Upload a warranty card, handover photo, or invoice via Documents below."
                    className="py-8 px-4 h-full"
                    action={
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={uploadDocumentMut.isPending}
                        onClick={() => uploadRef.current?.click()}
                      >
                        <Upload className="h-3.5 w-3.5" />
                        Upload file
                      </Button>
                    }
                  />
                ) : (
                  <EmptyState
                    icon={ImageIcon}
                    title="Photos unavailable"
                    description="Enable Firebase Storage to attach images and documents to this asset."
                    className="py-8 px-4 h-full"
                  />
                )}
              </div>
              <div className="flex-1 grid grid-cols-1 gap-4 text-sm min-w-0">
                <Field label="Asset ID" value={asset?.id ?? "—"} />
                <Field label="S No" value={asset?.serial ?? "—"} />
                <Field label="Name" value={asset?.name ?? "—"} />
                <Field label="Desk no" value={asset?.location ?? "—"} />
                <Field
                  label="Accessories & Softwares"
                  value={asset ? getAssetSpecificationLines(asset).join(" · ") || "—" : "—"}
                />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h3 className="text-sm font-semibold">Activity timeline</h3>
              {auditEntries.length > 0 ? (
                <Button type="button" variant="ghost" size="sm" className="h-8 text-xs" asChild>
                  <Link to="/admin/settings">View all in Settings</Link>
                </Button>
              ) : null}
            </div>
            {auditLoading ? (
              <p className="text-sm text-muted-foreground">Loading history…</p>
            ) : auditEntries.length === 0 ? (
              <EmptyState
                title="No activity yet"
                description="Changes to this asset will appear here after edits, transfers, or tickets."
              />
            ) : (
              <ol className="relative border-l border-border ml-2">
                {auditEntries.slice(0, 12).map((entry) => (
                  <li key={entry.id} className="ml-6 pb-5 last:pb-0">
                    <span className="absolute -left-1.5 h-3 w-3 rounded-full ring-4 ring-card bg-primary" />
                    <div className="text-xs text-muted-foreground">
                      {formatDateLabel(entry.createdAt)}
                    </div>
                    <div className="text-sm font-medium mt-0.5">{entry.action}</div>
                    <div className="text-xs text-muted-foreground">
                      {entry.entityType} · {entry.entityId}
                      {entry.actorEmail ? ` · ${entry.actorEmail}` : ""}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h3 className="text-sm font-semibold">Documents</h3>
              {storageEnabled ? (
                <>
                  <input
                    ref={uploadRef}
                    type="file"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      event.target.value = "";
                      if (!file) return;
                      uploadDocumentMut.mutate(file);
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploadDocumentMut.isPending}
                    onClick={() => uploadRef.current?.click()}
                  >
                    Upload file
                  </Button>
                </>
              ) : null}
            </div>
            {storageEnabled ? (
              documentsLoading ? (
                <p className="text-sm text-muted-foreground">Loading documents…</p>
              ) : documents.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="No documents yet"
                  description="Upload invoices, warranties, or handover files to Firebase Storage."
                  className="py-8"
                  action={
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={uploadDocumentMut.isPending}
                      onClick={() => uploadRef.current?.click()}
                    >
                      <Upload className="h-3.5 w-3.5" />
                      Upload file
                    </Button>
                  }
                />
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {documents.map((document) => (
                    <a
                      key={document.path}
                      href={document.url}
                      target="_blank"
                      rel="noreferrer"
                      className="border border-border rounded-lg p-3 flex items-center gap-3 hover:bg-muted/40 transition"
                    >
                      <div className="h-9 w-9 rounded bg-muted flex items-center justify-center">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{document.name}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {formatBytes(document.size)}
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              )
            ) : (
              <EmptyState
                title="Document storage off"
                description="Configure Firebase in .env to upload invoices, warranties, and handover files for this asset."
                className="py-8"
              />
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6 text-center">
            <div className="text-xs text-muted-foreground mb-3">Asset QR Code</div>
            <div className="mx-auto h-44 w-44 rounded-xl bg-white border border-border flex items-center justify-center overflow-hidden">
              {qrImageUrl ? (
                <img
                  src={qrImageUrl}
                  alt={`QR for ${id}`}
                  className="h-full w-full object-contain"
                />
              ) : (
                <QrCode className="h-32 w-32 text-foreground" strokeWidth={1.2} />
              )}
            </div>
            <div className="mt-3 text-xs font-mono">{qrPayload?.payload ?? id}</div>
            <Button
              type="button"
              variant="outline"
              className="mt-4 w-full"
              disabled={!qrImageUrl}
              onClick={() => {
                if (!qrImageUrl) return;
                const anchor = document.createElement("a");
                anchor.href = qrImageUrl;
                anchor.download = `${id}-qr.png`;
                anchor.click();
              }}
            >
              Download QR
            </Button>
          </Card>

          <Card className="p-6">
            <h3 className="text-sm font-semibold mb-2">Recent activity</h3>
            <p className="text-xs text-muted-foreground mb-4">
              {auditLoading
                ? "Loading…"
                : auditEntries.length === 0
                  ? "No events recorded for this asset."
                  : `${auditEntries.length} event${auditEntries.length === 1 ? "" : "s"} in the audit log.`}
            </p>
            {auditEntries.length > 0 ? (
              <Button type="button" variant="outline" className="w-full" asChild>
                <Link to="/admin/settings">View full audit log</Link>
              </Button>
            ) : null}
          </Card>
        </div>
      </div>

      <AssetFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        title="Edit asset"
        description="Update inventory fields for this asset."
        values={formValues}
        onChange={setFormValues}
        onSubmit={() => updateMut.mutate()}
        submitting={updateMut.isPending}
        idReadOnly
        submitLabel="Save changes"
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete asset</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes <span className="font-mono">{id}</span> from the inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={destructiveAlertActionClass}
              onClick={() => deleteMut.mutate()}
              disabled={deleteMut.isPending}
            >
              Delete asset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  );
}

function Field({
  icon: Icon,
  label,
  value,
}: {
  icon?: LucideIcon;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </div>
      <div className="mt-1 font-medium">{value}</div>
    </div>
  );
}
