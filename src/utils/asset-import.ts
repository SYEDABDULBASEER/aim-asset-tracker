import type { AssetFormValues } from "@/components/assets/AssetFormDialog";
import type { AssetCategory, AssetStatus } from "@/lib/models";
import { ASSET_CATEGORY_VALUES } from "@/lib/models";
import { parseCsvText } from "@/utils/csv";

const CATEGORY_OPTIONS = ASSET_CATEGORY_VALUES;
const STATUS_OPTIONS = ["Active", "In Repair", "Available", "Lost", "Retired"] as const satisfies readonly AssetStatus[];

const HEADER_ALIASES: Record<string, keyof AssetFormValues> = {
  id: "id",
  assetid: "id",
  name: "name",
  assetname: "name",
  category: "category",
  assignedto: "assignedTo",
  department: "department",
  status: "status",
  warrantyuntil: "warrantyUntil",
  lastserviceat: "lastServiceAt",
  serial: "serial",
  location: "location",
  purchasedate: "purchaseDate",
  specifications: "specifications",
  specs: "specifications",
  specification: "specifications",
};

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function normalizeCategory(value: string): AssetCategory {
  const trimmed = value.trim();
  if (CATEGORY_OPTIONS.includes(trimmed as AssetCategory)) {
    return trimmed as AssetCategory;
  }
  const match = CATEGORY_OPTIONS.find((option) => option.toLowerCase() === trimmed.toLowerCase());
  return match ?? "Laptop";
}

function normalizeStatus(value: string): AssetStatus {
  const trimmed = value.trim();
  if (STATUS_OPTIONS.includes(trimmed as AssetStatus)) {
    return trimmed as AssetStatus;
  }
  const match = STATUS_OPTIONS.find((option) => option.toLowerCase() === trimmed.toLowerCase());
  return match ?? "Available";
}

function emptyFormValues(): AssetFormValues {
  return {
    id: "",
    name: "",
    category: "Laptop",
    assignedTo: "",
    department: "",
    status: "Available",
    warrantyUntil: "",
    lastServiceAt: "",
    serial: "",
    location: "",
    purchaseDate: "",
    specifications: "",
  };
}

export function parseAssetImportCsv(text: string): AssetFormValues[] {
  const rows = parseCsvText(text);
  if (rows.length < 2) return [];

  const headers = rows[0]!.map(normalizeHeader);
  const columnIndex = new Map<keyof AssetFormValues, number>();
  headers.forEach((header, index) => {
    const field = HEADER_ALIASES[header];
    if (field && !columnIndex.has(field)) columnIndex.set(field, index);
  });

  if (!columnIndex.has("id") || !columnIndex.has("name")) return [];

  const get = (cells: string[], field: keyof AssetFormValues) => {
    const index = columnIndex.get(field);
    return index === undefined ? "" : (cells[index] ?? "").trim();
  };

  return rows.slice(1).map((cells) => {
    const values = emptyFormValues();
    values.id = get(cells, "id");
    values.name = get(cells, "name");
    values.category = normalizeCategory(get(cells, "category"));
    values.status = normalizeStatus(get(cells, "status"));
    values.assignedTo = get(cells, "assignedTo");
    values.department = get(cells, "department");
    values.warrantyUntil = get(cells, "warrantyUntil");
    values.lastServiceAt = get(cells, "lastServiceAt");
    values.serial = get(cells, "serial");
    values.location = get(cells, "location");
    values.purchaseDate = get(cells, "purchaseDate");
    values.specifications = get(cells, "specifications");
    return values;
  });
}
