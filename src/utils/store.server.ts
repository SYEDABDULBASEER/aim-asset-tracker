import type {
  Asset,
  AuditLogEntry,
  Employee,
  MaintenanceJob,
  OrgSettings,
  Ticket,
  Transfer,
  Vendor,
} from "@/lib/models";
import { AssetSchema, OrgSettingsSchema } from "@/lib/models";
import { buildSeedAssets } from "./seed.assets";
import { buildSeedTickets } from "./seed.tickets";
import { buildSeedTransfers } from "./seed.transfers";
import { buildSeedMaintenanceJobs } from "./seed.maintenance";
import { buildSeedEmployees } from "./seed.employees";
import { buildSeedVendors } from "./seed.vendors";

type Store = {
  assets: Map<string, Asset>;
  tickets: Map<string, Ticket>;
  transfers: Map<string, Transfer>;
  maintenanceJobs: Map<string, MaintenanceJob>;
  employees: Map<string, Employee>;
  vendors: Map<string, Vendor>;
  auditLogs: Map<string, AuditLogEntry>;
  orgSettings: OrgSettings;
};

export function buildDefaultOrgSettings(): OrgSettings {
  return OrgSettingsSchema.parse({
    id: "default",
    categories: ["Laptop", "Monitor", "Printer", "Mobile", "Network", "Desktop", "Accessory"],
    locations: ["HQ", "Warehouse", "Remote", "Repair Bench"],
    slaHoursByPriority: {
      Critical: 4,
      High: 24,
      Medium: 72,
      Low: 120,
    },
    notifications: {
      emailEnabled: false,
      inAppEnabled: true,
      webhookEnabled: false,
    },
  });
}

function createStore(): Store {
  const assets = new Map<string, Asset>();
  for (const a of buildSeedAssets()) assets.set(a.id, AssetSchema.parse(a));
  const tickets = new Map<string, Ticket>();
  for (const t of buildSeedTickets()) tickets.set(t.id, t);
  const transfers = new Map<string, Transfer>();
  for (const t of buildSeedTransfers()) transfers.set(t.id, t);
  const maintenanceJobs = new Map<string, MaintenanceJob>();
  for (const j of buildSeedMaintenanceJobs()) maintenanceJobs.set(j.id, j);
  const employees = new Map<string, Employee>();
  for (const e of buildSeedEmployees()) employees.set(e.id, e);
  const vendors = new Map<string, Vendor>();
  for (const v of buildSeedVendors()) vendors.set(v.id, v);
  return {
    assets,
    tickets,
    transfers,
    maintenanceJobs,
    employees,
    vendors,
    auditLogs: new Map<string, AuditLogEntry>(),
    orgSettings: buildDefaultOrgSettings(),
  };
}

export function syncBook1AssetsIntoStore(store: Store) {
  for (const seed of buildSeedAssets()) {
    const existing = store.assets.get(seed.id);
    store.assets.set(
      seed.id,
      AssetSchema.parse({
        ...existing,
        ...seed,
        assignedTo: existing?.assignedTo ?? seed.assignedTo,
        department: existing?.department ?? seed.department,
        status: existing?.status ?? seed.status,
        warrantyUntil: existing?.warrantyUntil ?? seed.warrantyUntil ?? null,
        lastServiceAt: existing?.lastServiceAt ?? seed.lastServiceAt ?? null,
        serial: seed.serial ?? existing?.serial ?? null,
        location: existing?.location ?? seed.location ?? null,
        purchaseDate: existing?.purchaseDate ?? seed.purchaseDate ?? null,
        specifications: existing?.specifications ?? seed.specifications ?? null,
      }),
    );
  }
}

declare global {
  var __assetDeskStore: Store | undefined;
}

export function getStore(): Store {
  if (!globalThis.__assetDeskStore) {
    globalThis.__assetDeskStore = createStore();
  }
  return globalThis.__assetDeskStore;
}
