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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Asset, AssetCategory, AssetStatus } from "@/lib/models";
import { DEPARTMENT_OPTIONS } from "@/lib/departments";

const CATEGORY_OPTIONS: AssetCategory[] = [
  "Desktop",
  "Monitor",
  "Laptop",
  "Accessory",
  "Printer",
  "Mobile",
  "Network",
];

const STATUS_OPTIONS: AssetStatus[] = ["Active", "In Repair", "Available", "Lost", "Retired"];

/** Radix Select forbids empty-string item values; map to form "" / null on save. */
const DEPARTMENT_UNASSIGNED = "__unassigned__";

export type AssetFormValues = {
  id: string;
  name: string;
  category: AssetCategory;
  assignedTo: string;
  department: string;
  status: AssetStatus;
  warrantyUntil: string;
  lastServiceAt: string;
  serial: string;
  location: string;
  purchaseDate: string;
  specifications: string;
};

function toDateInput(value: string | null | undefined) {
  if (!value) return "";
  const date = value.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : "";
}

export function assetToFormValues(asset?: Asset | null): AssetFormValues {
  return {
    id: asset?.id ?? "",
    name: asset?.name ?? "",
    category: asset?.category ?? "Laptop",
    assignedTo: asset?.assignedTo ?? "",
    department: asset?.department ?? "",
    status: asset?.status ?? "Available",
    warrantyUntil: toDateInput(asset?.warrantyUntil),
    lastServiceAt: toDateInput(asset?.lastServiceAt),
    serial: asset?.serial ?? "",
    location: asset?.location ?? "",
    purchaseDate: toDateInput(asset?.purchaseDate),
    specifications: asset?.specifications ?? "",
  };
}

type AssetFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  values: AssetFormValues;
  onChange: (values: AssetFormValues) => void;
  onSubmit: () => void;
  submitting?: boolean;
  idReadOnly?: boolean;
  submitLabel?: string;
};

export function AssetFormDialog({
  open,
  onOpenChange,
  title,
  description,
  values,
  onChange,
  onSubmit,
  submitting,
  idReadOnly,
  submitLabel = "Save",
}: AssetFormDialogProps) {
  const set = (patch: Partial<AssetFormValues>) => onChange({ ...values, ...patch });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="grid gap-1.5">
            <Label htmlFor="asset-id">Asset ID</Label>
            <Input
              id="asset-id"
              value={values.id}
              readOnly={idReadOnly}
              onChange={(e) => set({ id: e.target.value })}
              placeholder="Enter a unique asset ID"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="asset-name">Asset Name</Label>
            <Input
              id="asset-name"
              value={values.name}
              onChange={(e) => set({ name: e.target.value })}
              placeholder="Device or asset name"
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Category</Label>
            <Select
              value={values.category}
              onValueChange={(v) => set({ category: v as AssetCategory })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="asset-specifications">Specifications</Label>
            <Textarea
              id="asset-specifications"
              value={values.specifications}
              onChange={(e) => set({ specifications: e.target.value })}
              placeholder="Ram-64GB; SSD-1TB; Processor-I9-12th gen"
              rows={4}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="asset-assigned">Assigned To</Label>
              <Input
                id="asset-assigned"
                value={values.assignedTo}
                onChange={(e) => set({ assignedTo: e.target.value })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="asset-department">Department</Label>
              <Select
                value={values.department || DEPARTMENT_UNASSIGNED}
                onValueChange={(v) => set({ department: v === DEPARTMENT_UNASSIGNED ? "" : v })}
              >
                <SelectTrigger id="asset-department">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={DEPARTMENT_UNASSIGNED}>Unassigned</SelectItem>
                  {DEPARTMENT_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>Status</Label>
            <Select value={values.status} onValueChange={(v) => set({ status: v as AssetStatus })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="asset-serial">Serial</Label>
              <Input
                id="asset-serial"
                value={values.serial}
                onChange={(e) => set({ serial: e.target.value })}
                placeholder="Manufacturer serial"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="asset-location">Desk no</Label>
              <Input
                id="asset-location"
                value={values.location}
                onChange={(e) => set({ location: e.target.value })}
                placeholder="e.g. Desk-04"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="asset-purchase-date">Purchase date</Label>
              <Input
                id="asset-purchase-date"
                type="date"
                value={values.purchaseDate}
                onChange={(e) => set({ purchaseDate: e.target.value })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="asset-warranty-until">Warranty until</Label>
              <Input
                id="asset-warranty-until"
                type="date"
                value={values.warrantyUntil}
                onChange={(e) => set({ warrantyUntil: e.target.value })}
              />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="asset-last-service">Last service</Label>
            <Input
              id="asset-last-service"
              type="date"
              value={values.lastServiceAt}
              onChange={(e) => set({ lastServiceAt: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={onSubmit} disabled={submitting}>
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
