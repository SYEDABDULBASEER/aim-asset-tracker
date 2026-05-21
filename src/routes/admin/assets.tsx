import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Card, PageHeader, StatusPill } from "@/components/ui-kit/Card";
import { EmptyState } from "@/components/ui-kit/EmptyState";
import { ListPageSkeleton } from "@/components/ui-kit/ListPageSkeleton";
import { PageShell } from "@/components/ui-kit/PageShell";
import { TableCard } from "@/components/ui-kit/TableCard";
import { AuthStatusBanner } from "@/components/auth/AuthStatusBanner";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, Filter, Download, Plus, Upload, X, Trash2, Pencil } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  createAsset,
  deleteAsset,
  exportAssetsCsv,
  importAssetsBulk,
  listAssets,
  updateAsset,
} from "@/utils/assets.functions";
import { parseAssetImportCsv } from "@/utils/asset-import";
import { formatAssetsQueryError } from "@/lib/auth/list-query-error";
import { callAuthenticatedServerFn } from "@/lib/auth/authenticated-server-fn";
import { assetStatusTone } from "@/lib/ui/status-tones";
import { destructiveAlertActionClass, destructiveIconButtonClass } from "@/lib/ui/button-hierarchy";
import {
  useAuth,
  useAuthQueryEnabled,
  useCanWriteAssets,
  useIsAdmin,
} from "@/lib/auth/AuthProvider";
import type { Asset, AssetCategory, AssetStatus, WarrantyBand } from "@/lib/models";
import {
  AssetFormDialog,
  assetToFormValues,
  type AssetFormValues,
} from "@/components/assets/AssetFormDialog";
import { AssetNameCell } from "@/components/assets/AssetNameCell";

export const Route = createFileRoute("/admin/assets")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === "string" ? search.q : undefined,
  }),
  head: () => ({ meta: [{ title: "Assets — Asset Desk" }] }),
  component: AssetsPage,
});

const PAGE_SIZE = 25;

const CATEGORY_OPTIONS: AssetCategory[] = [
  "Desktop",
  "Monitor",
  "Laptop",
  "Accessory",
  "Printer",
  "Mobile",
  "Network",
];

const DEPARTMENT_OPTIONS = [
  "IT",
  "Design",
  "Sales",
  "Marketing",
  "HR",
  "Operations",
  "Finance",
  "Stock",
  "Shared",
] as const;

const STATUS_OPTIONS: AssetStatus[] = ["Active", "In Repair", "Available", "Lost", "Retired"];

const WARRANTY_BAND_OPTIONS: { value: WarrantyBand; label: string }[] = [
  { value: "active", label: "Active warranty" },
  { value: "expiring", label: "Expiring soon" },
  { value: "expired", label: "Expired" },
  { value: "unknown", label: "Unknown" },
];

type FilterPopoverProps<T extends string> = {
  label: string;
  value: T | "";
  options: readonly T[] | T[];
  displayValue: (v: T) => string;
  onChange: (v: T | "") => void;
};

function FilterPopover<T extends string>({
  label,
  value,
  options,
  displayValue,
  onChange,
}: FilterPopoverProps<T>) {
  const [open, setOpen] = useState(false);
  const summary = value ? displayValue(value) : "All";
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`h-9 px-3 rounded-lg border text-sm inline-flex items-center gap-1.5 transition ${
            value
              ? "border-primary bg-primary/10 text-primary font-medium"
              : "border-border bg-card hover:bg-muted"
          }`}
        >
          <Filter className="h-3.5 w-3.5" />
          {label}
          <span className="text-muted-foreground font-normal">· {summary}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="start">
        <div className="text-[11px] font-medium text-muted-foreground px-2 py-1.5 uppercase tracking-wider">
          {label}
        </div>
        <button
          type="button"
          className="w-full text-left rounded-md px-2 py-1.5 text-sm hover:bg-muted"
          onClick={() => {
            onChange("");
            setOpen(false);
          }}
        >
          All
        </button>
        {options.map((opt) => (
          <button
            key={String(opt)}
            type="button"
            className={`w-full text-left rounded-md px-2 py-1.5 text-sm hover:bg-muted ${
              value === opt ? "bg-muted font-medium" : ""
            }`}
            onClick={() => {
              onChange(opt);
              setOpen(false);
            }}
          >
            {displayValue(opt)}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

function emptyForm(): AssetFormValues {
  return assetToFormValues();
}

function toNullable(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function toNullableDate(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full border border-primary/30 bg-primary/10 text-xs font-medium text-primary hover:bg-primary/15 transition"
    >
      {label}
      <X className="h-3 w-3" />
    </button>
  );
}

function AssetsPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const isAdmin = useIsAdmin();
  const canWriteAssets = useCanWriteAssets();
  const queryClient = useQueryClient();
  const uploadRef = useRef<HTMLInputElement>(null);
  const { q: searchQ } = Route.useSearch();
  const [q, setQ] = useState(searchQ ?? "");
  const [page, setPage] = useState(0);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [category, setCategory] = useState<AssetCategory | "">("");
  const [department, setDepartment] = useState<(typeof DEPARTMENT_OPTIONS)[number] | "">("");
  const [status, setStatus] = useState<AssetStatus | "">("");
  const [warrantyBand, setWarrantyBand] = useState<WarrantyBand | "">("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Asset | null>(null);
  const [formValues, setFormValues] = useState<AssetFormValues>(emptyForm);

  useEffect(() => {
    setQ(searchQ ?? "");
    setPage(0);
  }, [searchQ]);

  useEffect(() => {
    const trimmed = q.trim();
    const urlQ = (searchQ ?? "").trim();
    if (trimmed === urlQ) return;
    const timer = window.setTimeout(() => {
      void navigate({
        to: "/admin/assets",
        search: { q: trimmed || undefined },
        replace: true,
      });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [navigate, q, searchQ]);

  const queryInput = useMemo(
    () => ({
      q: q.trim() || undefined,
      category: category || undefined,
      department: department || undefined,
      status: status || undefined,
      warrantyBand: warrantyBand || undefined,
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
    }),
    [q, category, department, status, warrantyBand, page],
  );

  const authReady = useAuthQueryEnabled();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["assets", queryInput],
    queryFn: () => callAuthenticatedServerFn(listAssets, { data: queryInput }),
    enabled: authReady,
    retry: 1,
  });

  const invalidateAssets = () => {
    void queryClient.invalidateQueries({ queryKey: ["assets"] });
    void queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
  };

  const createMut = useMutation({
    mutationFn: () => {
      const id = formValues.id.trim();
      const name = formValues.name.trim();
      if (!id) throw new Error("Asset ID is required.");
      if (!name) throw new Error("Asset name is required.");
      return callAuthenticatedServerFn(createAsset, {
        data: {
          id,
          name,
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
      });
    },
    onSuccess: (asset) => {
      toast.success("Asset created", { description: asset.id });
      setCreateOpen(false);
      setFormValues(emptyForm());
      invalidateAssets();
    },
    onError: (e: Error) => toast.error(e.message ?? "Create failed"),
  });

  const updateMut = useMutation({
    mutationFn: () => {
      if (!editTarget) throw new Error("No asset selected.");
      const name = formValues.name.trim();
      if (!name) throw new Error("Asset name is required.");
      return callAuthenticatedServerFn(updateAsset, {
        data: {
          id: editTarget.id,
          name,
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
      });
    },
    onSuccess: () => {
      toast.success("Asset updated", { description: editTarget?.id });
      setEditTarget(null);
      setFormValues(emptyForm());
      invalidateAssets();
    },
    onError: (e: Error) => toast.error(e.message ?? "Update failed"),
  });

  const exportMut = useMutation({
    mutationFn: () => callAuthenticatedServerFn(exportAssetsCsv),
    onSuccess: ({ csv, filename }) => {
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success("Export ready", { description: filename });
    },
    onError: (e: Error) => toast.error(e.message ?? "Export failed"),
  });

  const importMut = useMutation({
    mutationFn: (rows: AssetFormValues[]) =>
      callAuthenticatedServerFn(importAssetsBulk, {
        data: {
          rows: rows.map((row) => ({
            id: row.id.trim(),
            name: row.name.trim(),
            category: row.category,
            status: row.status,
            assignedTo: toNullable(row.assignedTo),
            department: toNullable(row.department),
            specifications: toNullable(row.specifications),
            warrantyUntil: toNullableDate(row.warrantyUntil),
            lastServiceAt: toNullableDate(row.lastServiceAt),
            serial: toNullable(row.serial),
            location: toNullable(row.location),
            purchaseDate: toNullableDate(row.purchaseDate),
          })),
        },
      }),
    onSuccess: (result) => {
      const summary = [
        `${result.created.length} created`,
        `${result.updated.length} updated`,
        `${result.skipped.length} skipped`,
      ].join(", ");
      if (result.created.length === 0 && result.updated.length === 0 && result.errors.length === 0) {
        toast.error("No assets were imported", { description: summary });
        return;
      }
      if (result.errors.length > 0) {
        toast.warning("Import finished with issues", {
          description: `${summary}. ${result.errors[0]}`,
        });
      } else {
        toast.success("Import finished", { description: summary });
      }
      invalidateAssets();
    },
    onError: (e: Error) => toast.error(e.message ?? "Import failed"),
  });

  const deleteMut = useMutation({
    mutationFn: (assetId: string) =>
      callAuthenticatedServerFn(deleteAsset, { data: { id: assetId } }),
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error("Asset not found");
        return;
      }
      toast.success("Asset deleted");
      setDeleteTargetId(null);
      invalidateAssets();
    },
    onError: (e: Error) => toast.error(e.message ?? "Delete failed"),
  });

  const assets = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const pageWindow = useMemo(() => {
    const windowSize = 5;
    let start = Math.max(0, page - Math.floor(windowSize / 2));
    const end = Math.min(totalPages - 1, start + windowSize - 1);
    start = Math.max(0, end - windowSize + 1);
    const pages: number[] = [];
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }, [page, totalPages]);

  const hasFilters = Boolean(category || department || status || warrantyBand || q.trim());

  return (
    <PageShell variant="wide">
      <PageHeader
        title="Assets"
        subtitle={
          isLoading
            ? "Loading assets…"
            : isError
              ? "Failed to load assets"
              : `${total} assets · page ${page + 1} of ${totalPages}`
        }
        action={
          <div className="flex items-center gap-2">
            <input
              ref={uploadRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (!file) return;
                const text = await file.text();
                const rows = parseAssetImportCsv(text).filter((row) => row.id && row.name);
                if (!rows.length) {
                  toast.error("No valid rows found in CSV", {
                    description: "Include id and name columns. Export a template from Assets if needed.",
                  });
                  return;
                }
                importMut.mutate(rows);
              }}
            />
            <Button
              type="button"
              variant="outline"
              className="h-9"
              onClick={() => uploadRef.current?.click()}
              disabled={importMut.isPending || !canWriteAssets}
            >
              <Upload className="h-4 w-4" />
              Bulk Upload
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-9"
              onClick={() => exportMut.mutate()}
              disabled={exportMut.isPending}
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button
              type="button"
              className="h-9 shadow-soft"
              disabled={!canWriteAssets}
              title={canWriteAssets ? undefined : "Viewers cannot add assets"}
              onClick={() => {
                setFormValues(emptyForm());
                setCreateOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Add Asset
            </Button>
          </div>
        }
      />

      <Card className="p-4 mb-4">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(0);
              }}
              placeholder="Search by ID, name, employee…"
              className="w-full h-9 pl-9 pr-3 rounded-lg bg-muted text-sm focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
          </div>
          <FilterPopover<AssetCategory>
            label="Category"
            value={category}
            options={CATEGORY_OPTIONS}
            displayValue={(v) => v}
            onChange={(v) => {
              setCategory(v);
              setPage(0);
            }}
          />
          <FilterPopover<(typeof DEPARTMENT_OPTIONS)[number]>
            label="Department"
            value={department}
            options={[...DEPARTMENT_OPTIONS]}
            displayValue={(v) => v}
            onChange={(v) => {
              setDepartment(v);
              setPage(0);
            }}
          />
          <FilterPopover<AssetStatus>
            label="Status"
            value={status}
            options={STATUS_OPTIONS}
            displayValue={(v) => v}
            onChange={(v) => {
              setStatus(v);
              setPage(0);
            }}
          />
          <FilterPopover<WarrantyBand>
            label="Warranty"
            value={warrantyBand}
            options={WARRANTY_BAND_OPTIONS.map((option) => option.value)}
            displayValue={(v) => WARRANTY_BAND_OPTIONS.find((option) => option.value === v)?.label ?? v}
            onChange={(v) => {
              setWarrantyBand(v);
              setPage(0);
            }}
          />
          {hasFilters && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9"
              onClick={() => {
                setQ("");
                setCategory("");
                setDepartment("");
                setStatus("");
                setWarrantyBand("");
                setPage(0);
              }}
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Clear filters
            </Button>
          )}
        </div>
        {hasFilters ? (
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border">
            {q.trim() ? (
              <FilterChip label={`Search: ${q.trim()}`} onRemove={() => setQ("")} />
            ) : null}
            {category ? (
              <FilterChip label={`Category: ${category}`} onRemove={() => setCategory("")} />
            ) : null}
            {department ? (
              <FilterChip label={`Department: ${department}`} onRemove={() => setDepartment("")} />
            ) : null}
            {status ? (
              <FilterChip label={`Status: ${status}`} onRemove={() => setStatus("")} />
            ) : null}
            {warrantyBand ? (
              <FilterChip
                label={`Warranty: ${WARRANTY_BAND_OPTIONS.find((o) => o.value === warrantyBand)?.label ?? warrantyBand}`}
                onRemove={() => setWarrantyBand("")}
              />
            ) : null}
          </div>
        ) : null}
      </Card>

      {isLoading && assets.length === 0 ? (
        <ListPageSkeleton rows={8} columns={7} />
      ) : (
      <TableCard scrollLabel="Asset inventory">
        {isError ? (
          <AuthStatusBanner
            error={formatAssetsQueryError(error)}
            onRetry={() => void refetch()}
            onSignOut={auth.user ? () => void auth.signOut() : undefined}
          />
        ) : null}
        {!isLoading && !isError && assets.length === 0 ? (
          <EmptyState
            title={hasFilters ? "No assets match your filters" : "No assets yet"}
            description={
              hasFilters
                ? "Try clearing filters or broadening your search."
                : "Add your first asset or import a CSV to populate inventory."
            }
            action={
              canWriteAssets && !hasFilters ? (
                <Button
                  type="button"
                  className="h-9 shadow-soft"
                  onClick={() => {
                    setFormValues(emptyForm());
                    setCreateOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Add asset
                </Button>
              ) : undefined
            }
          />
        ) : (
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
              <th className="text-left font-medium px-4 py-3">Asset ID</th>
              <th className="text-left font-medium px-4 py-3">Name</th>
              <th className="text-left font-medium px-4 py-3 hidden md:table-cell">Status</th>
              <th className="text-left font-medium px-4 py-3 hidden md:table-cell">Category</th>
              <th className="text-left font-medium px-4 py-3 hidden md:table-cell">Assigned to</th>
              <th className="text-left font-medium px-4 py-3 hidden lg:table-cell">S No</th>
              <th className="text-left font-medium px-4 py-3 hidden lg:table-cell">Desk</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {assets.map((a) => (
              <tr key={a.id} className="border-t border-border hover:bg-muted/30 transition">
                <td className="px-4 py-3 font-medium">
                  <Link
                    to="/admin/assets/$id"
                    params={{ id: a.id }}
                    search={{ q: undefined }}
                    className="text-primary hover:underline"
                  >
                    {a.id}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <AssetNameCell asset={a} />
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <StatusPill tone={assetStatusTone(a.status)}>{a.status}</StatusPill>
                </td>
                <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{a.category}</td>
                <td className="px-4 py-3 hidden md:table-cell">{a.assignedTo ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground font-mono text-xs hidden lg:table-cell">
                  {a.serial ?? "—"}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground hidden lg:table-cell">
                  {a.location ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    {canWriteAssets ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        aria-label={`Edit ${a.id}`}
                        onClick={() => {
                          setEditTarget(a);
                          setFormValues(assetToFormValues(a));
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    ) : null}
                    {isAdmin ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className={`h-7 w-7 ${destructiveIconButtonClass}`}
                        aria-label={`Delete asset ${a.id}`}
                        onClick={() => setDeleteTargetId(a.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden />
                      </Button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
        {!isError && assets.length > 0 ? (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border text-xs text-muted-foreground">
          <span>
            Showing {total === 0 ? 0 : page * PAGE_SIZE + 1}–
            {Math.min((page + 1) * PAGE_SIZE, total)} of {total}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="h-7 px-2 rounded border border-border hover:bg-muted disabled:opacity-40"
              disabled={page <= 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Prev
            </button>
            {pageWindow.map((n) => (
              <button
                key={n}
                type="button"
                className={`h-7 w-7 rounded text-xs ${
                  page === n ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                }`}
                onClick={() => setPage(n)}
              >
                {n + 1}
              </button>
            ))}
            <button
              type="button"
              className="h-7 px-2 rounded border border-border hover:bg-muted disabled:opacity-40"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            >
              Next
            </button>
          </div>
        </div>
        ) : null}
      </TableCard>
      )}

      <AssetFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Add asset"
        description="Enter a unique asset ID and fill in the details you want to track."
        values={formValues}
        onChange={setFormValues}
        onSubmit={() => createMut.mutate()}
        submitting={createMut.isPending}
        submitLabel="Create asset"
      />

      <AssetFormDialog
        open={editTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditTarget(null);
            setFormValues(emptyForm());
          }
        }}
        title="Edit asset"
        description="Update inventory fields for this asset."
        values={formValues}
        onChange={setFormValues}
        onSubmit={() => updateMut.mutate()}
        submitting={updateMut.isPending}
        idReadOnly
        submitLabel="Save changes"
      />

      <AlertDialog
        open={deleteTargetId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTargetId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete asset</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTargetId
                ? `This permanently removes ${deleteTargetId} from inventory. This action cannot be undone.`
                : "This permanently removes the asset from inventory."}
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
              Delete asset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  );
}
