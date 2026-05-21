import { z } from "zod";

export const AssetStatusSchema = z.enum(["Active", "In Repair", "Available", "Lost", "Retired"]);
export type AssetStatus = z.infer<typeof AssetStatusSchema>;

export const ASSET_CATEGORY_VALUES = [
  "Laptop",
  "Monitor",
  "Printer",
  "Mobile",
  "Network",
  "Desktop",
  "Accessory",
] as const;

function normalizeAssetRecord(value: unknown): unknown {
  if (!value || typeof value !== "object") return value;
  const record = { ...(value as Record<string, unknown>) };
  if (record.category === "Servers") record.category = "Desktop";
  for (const key of [
    "warrantyUntil",
    "lastServiceAt",
    "serial",
    "location",
    "purchaseDate",
    "assignedTo",
    "department",
    "specifications",
  ] as const) {
    if (record[key] === undefined) record[key] = null;
  }
  return record;
}

export const AssetCategorySchema = z.enum(ASSET_CATEGORY_VALUES);
export type AssetCategory = z.infer<typeof AssetCategorySchema>;

export const WarrantyBandSchema = z.enum(["expired", "expiring", "active", "unknown"]);
export type WarrantyBand = z.infer<typeof WarrantyBandSchema>;

const AssetRecordSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  category: AssetCategorySchema,
  assignedTo: z.string().nullable(),
  department: z.string().nullable(),
  status: AssetStatusSchema,
  warrantyUntil: z.string().nullable(),
  lastServiceAt: z.string().nullable(),
  serial: z.string().nullable(),
  location: z.string().nullable(),
  purchaseDate: z.string().nullable(),
  specifications: z.string().nullable(),
});

export const AssetSchema = z.preprocess(normalizeAssetRecord, AssetRecordSchema);
export type Asset = z.infer<typeof AssetRecordSchema>;

export const AssetCreateSchema = AssetRecordSchema.pick({
  id: true,
  name: true,
  category: true,
  status: true,
}).extend({
  assignedTo: z.string().nullable().optional(),
  department: z.string().nullable().optional(),
  warrantyUntil: z.string().nullable().optional(),
  lastServiceAt: z.string().nullable().optional(),
  serial: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  purchaseDate: z.string().nullable().optional(),
  specifications: z.string().nullable().optional(),
});
export type AssetCreateInput = z.infer<typeof AssetCreateSchema>;

export const AssetUpdateSchema = AssetRecordSchema.partial().extend({
  id: z.string().min(1),
});
export type AssetUpdateInput = z.infer<typeof AssetUpdateSchema>;

export const AssetListQuerySchema = z.object({
  q: z.string().optional(),
  status: AssetStatusSchema.optional(),
  category: AssetCategorySchema.optional(),
  department: z.string().optional(),
  warrantyBand: WarrantyBandSchema.optional(),
  limit: z.number().int().min(1).max(500).optional(),
  offset: z.number().int().min(0).optional(),
});
export type AssetListQuery = z.infer<typeof AssetListQuerySchema>;

/** Service desk ticket lifecycle (aligned with Kanban columns). */
export const TicketStatusSchema = z.enum([
  "Open",
  "In Progress",
  "Waiting Parts",
  "Resolved",
  "Closed",
]);
export type TicketStatus = z.infer<typeof TicketStatusSchema>;

export const TicketPrioritySchema = z.enum(["Critical", "High", "Medium", "Low"]);
export type TicketPriority = z.infer<typeof TicketPrioritySchema>;

export const TicketMessageSchema = z.object({
  id: z.string().min(1),
  author: z.string().min(1),
  body: z.string().min(1),
  createdAt: z.string().min(1),
});
export type TicketMessage = z.infer<typeof TicketMessageSchema>;

export const TicketOpenedViaSchema = z.enum(["staff", "user_portal"]);
export type TicketOpenedVia = z.infer<typeof TicketOpenedViaSchema>;

export const TicketSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  assetId: z.string().nullable(),
  priority: TicketPrioritySchema,
  status: TicketStatusSchema,
  assigneeName: z.string().nullable(),
  requesterName: z.string().nullable(),
  /** Office / desk number for user-portal tickets (e.g. D-204). */
  deskNumber: z.string().max(50).nullable().optional(),
  /** Set for user-portal submissions; used to show “my tickets” to the requester. */
  requesterEmail: z.union([z.string().email(), z.null()]).optional(),
  /** Submitted from the public “report an issue” page vs staff tooling. */
  openedVia: TicketOpenedViaSchema.optional(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  /** Target first response / resolution anchor (ISO). Used for SLA breach signals. */
  slaDueAt: z.string().nullable(),
  messages: z.array(TicketMessageSchema).default([]),
});
export type Ticket = z.infer<typeof TicketSchema>;

export const TicketCreateInputSchema = z.object({
  title: z.string().min(1).max(500),
  assetId: z.string().min(1).nullable().optional(),
  priority: TicketPrioritySchema,
  requesterName: z.string().min(1).max(200),
  assigneeName: z.string().min(1).max(200).nullable().optional(),
  description: z.string().max(8000).optional(),
});
export type TicketCreateInput = z.infer<typeof TicketCreateInputSchema>;

/** Public self-service form (no staff sign-in). */
export const TicketUserPortalCreateSchema = z.object({
  title: z.string().min(5).max(500),
  description: z.string().min(10).max(8000),
  requesterName: z.string().min(2).max(200),
  requesterEmail: z.union([z.string().email().max(320), z.literal("")]).optional(),
  deskNumber: z.string().min(1).max(50),
  priority: TicketPrioritySchema,
  assetId: z.string().min(1).max(120).nullable().optional(),
});
export type TicketUserPortalCreateInput = z.infer<typeof TicketUserPortalCreateSchema>;

export const TicketUpdateSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1).max(500).optional(),
    assetId: z.string().min(1).nullable().optional(),
    priority: TicketPrioritySchema.optional(),
    status: TicketStatusSchema.optional(),
    assigneeName: z.string().min(1).max(200).nullable().optional(),
    requesterName: z.string().min(1).max(200).nullable().optional(),
  })
  .strict();
export type TicketUpdateInput = z.infer<typeof TicketUpdateSchema>;

export const TicketStatusUpdateSchema = z.object({
  id: z.string().min(1),
  status: TicketStatusSchema,
});
export type TicketStatusUpdateInput = z.infer<typeof TicketStatusUpdateSchema>;

/** Employee portal — list tickets for a requester email. */
export const PortalTicketListQuerySchema = z.object({
  requesterEmail: z.string().email().max(320),
  requesterName: z.string().max(200).optional(),
});
export type PortalTicketListQuery = z.infer<typeof PortalTicketListQuerySchema>;

/** Employee portal — ticket detail scoped to requester. */
export const PortalTicketDetailQuerySchema = z.object({
  id: z.string().min(1),
  requesterEmail: z.string().email().max(320),
  requesterName: z.string().max(200).optional(),
});
export type PortalTicketDetailQuery = z.infer<typeof PortalTicketDetailQuerySchema>;

export const TicketCommentInputSchema = z.object({
  id: z.string().min(1),
  author: z.string().min(1).max(200),
  body: z.string().min(1).max(8000),
});
export type TicketCommentInput = z.infer<typeof TicketCommentInputSchema>;

export const TicketListQuerySchema = z.object({
  q: z.string().optional(),
  status: TicketStatusSchema.optional(),
  priority: TicketPrioritySchema.optional(),
  limit: z.number().int().min(1).max(500).optional(),
  offset: z.number().int().min(0).optional(),
});
export type TicketListQuery = z.infer<typeof TicketListQuerySchema>;

export const TransferStatusSchema = z.enum(["Pending", "Approved", "Rejected"]);
export type TransferStatus = z.infer<typeof TransferStatusSchema>;

function normalizeTransferRecord(value: unknown): unknown {
  if (!value || typeof value !== "object") return value;
  const record = { ...(value as Record<string, unknown>) };
  if (record.fromEmployeeId === undefined) record.fromEmployeeId = null;
  if (record.toEmployeeId === undefined) record.toEmployeeId = null;
  return record;
}

export const TransferSchema = z.preprocess(
  normalizeTransferRecord,
  z.object({
    id: z.string().min(1),
    assetId: z.string().min(1),
    fromParty: z.string().min(1),
    toParty: z.string().min(1),
    fromEmployeeId: z.string().nullable(),
    toEmployeeId: z.string().nullable(),
    status: TransferStatusSchema,
    requestedAt: z.string().min(1),
    notes: z.string().nullable(),
  }),
);
export type Transfer = z.infer<typeof TransferSchema>;

export const TransferCreateInputSchema = z.object({
  assetId: z.string().min(1),
  fromParty: z.string().min(1).max(200),
  toParty: z.string().min(1).max(200),
  fromEmployeeId: z.string().min(1).nullable().optional(),
  toEmployeeId: z.string().min(1).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
});
export type TransferCreateInput = z.infer<typeof TransferCreateInputSchema>;

export const TransferStatusUpdateSchema = z.object({
  id: z.string().min(1),
  status: TransferStatusSchema,
});
export type TransferStatusUpdateInput = z.infer<typeof TransferStatusUpdateSchema>;

export const TransferListQuerySchema = z.object({
  q: z.string().optional(),
  status: TransferStatusSchema.optional(),
  assetId: z.string().optional(),
  limit: z.number().int().min(1).max(500).optional(),
  offset: z.number().int().min(0).optional(),
});
export type TransferListQuery = z.infer<typeof TransferListQuerySchema>;

export const MaintenanceTypeSchema = z.enum(["Preventive", "Repair", "Inspection"]);
export type MaintenanceType = z.infer<typeof MaintenanceTypeSchema>;

function normalizeMaintenanceRecord(value: unknown): unknown {
  if (!value || typeof value !== "object") return value;
  const record = { ...(value as Record<string, unknown>) };
  if (record.vendorId === undefined) record.vendorId = null;
  return record;
}

export const MaintenanceStatusSchema = z.enum([
  "Scheduled",
  "In Progress",
  "Completed",
  "Cancelled",
]);
export type MaintenanceStatus = z.infer<typeof MaintenanceStatusSchema>;

export const MaintenanceJobSchema = z.preprocess(
  normalizeMaintenanceRecord,
  z.object({
    id: z.string().min(1),
    assetId: z.string().min(1),
    type: MaintenanceTypeSchema,
    vendor: z.string().min(1),
    vendorId: z.string().nullable(),
    scheduledAt: z.string().min(1),
    status: MaintenanceStatusSchema,
    notes: z.string().nullable(),
  }),
);
export type MaintenanceJob = z.infer<typeof MaintenanceJobSchema>;

export const MaintenanceJobCreateInputSchema = z.object({
  assetId: z.string().min(1),
  type: MaintenanceTypeSchema,
  vendor: z.string().min(1).max(200),
  vendorId: z.string().min(1).nullable().optional(),
  scheduledAt: z.string().min(1),
  notes: z.string().max(2000).nullable().optional(),
});
export type MaintenanceJobCreateInput = z.infer<typeof MaintenanceJobCreateInputSchema>;

export const MaintenanceJobUpdateSchema = z
  .object({
    id: z.string().min(1),
    type: MaintenanceTypeSchema.optional(),
    vendor: z.string().min(1).max(200).optional(),
    scheduledAt: z.string().min(1).optional(),
    status: MaintenanceStatusSchema.optional(),
    notes: z.string().max(2000).nullable().optional(),
  })
  .strict();
export type MaintenanceJobUpdateInput = z.infer<typeof MaintenanceJobUpdateSchema>;

export const MaintenanceListQuerySchema = z.object({
  q: z.string().optional(),
  status: MaintenanceStatusSchema.optional(),
  assetId: z.string().optional(),
  limit: z.number().int().min(1).max(500).optional(),
  offset: z.number().int().min(0).optional(),
});
export type MaintenanceListQuery = z.infer<typeof MaintenanceListQuerySchema>;

export const EmployeeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  role: z.string().min(1),
  department: z.string().min(1),
  email: z.string().email(),
  assetCount: z.number().int().min(0),
});
export type Employee = z.infer<typeof EmployeeSchema>;

export const EmployeeListQuerySchema = z.object({
  q: z.string().optional(),
  department: z.string().optional(),
  limit: z.number().int().min(1).max(500).optional(),
  offset: z.number().int().min(0).optional(),
});
export type EmployeeListQuery = z.infer<typeof EmployeeListQuerySchema>;

export const VendorSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1),
  contactEmail: z.string().email(),
  contracts: z.number().int().min(0),
  slaPercent: z.number().min(0).max(100),
  responseHours: z.number().min(0),
});
export type Vendor = z.infer<typeof VendorSchema>;

export const VendorListQuerySchema = z.object({
  q: z.string().optional(),
  limit: z.number().int().min(1).max(500).optional(),
  offset: z.number().int().min(0).optional(),
});
export type VendorListQuery = z.infer<typeof VendorListQuerySchema>;

export const AssetImportRowSchema = AssetCreateSchema;
export const AssetImportSchema = z.object({
  rows: z.array(AssetImportRowSchema).min(1).max(500),
});
export type AssetImportInput = z.infer<typeof AssetImportSchema>;

export const EmployeeCreateSchema = EmployeeSchema.omit({ assetCount: true });
export type EmployeeCreateInput = z.infer<typeof EmployeeCreateSchema>;

export const EmployeeUpdateSchema = EmployeeCreateSchema.partial().extend({
  id: z.string().min(1),
});
export type EmployeeUpdateInput = z.infer<typeof EmployeeUpdateSchema>;

export const VendorCreateSchema = VendorSchema;
export type VendorCreateInput = z.infer<typeof VendorCreateSchema>;

export const VendorUpdateSchema = VendorCreateSchema.partial().extend({
  id: z.string().min(1),
});
export type VendorUpdateInput = z.infer<typeof VendorUpdateSchema>;

export const AuditLogEntrySchema = z.object({
  id: z.string().min(1),
  actorUid: z.string().min(1),
  actorEmail: z.string().nullable(),
  action: z.string().min(1),
  entityType: z.string().min(1),
  entityId: z.string().min(1),
  createdAt: z.string().min(1),
  metadata: z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])).nullable(),
});
export type AuditLogEntry = z.infer<typeof AuditLogEntrySchema>;

export const AuditLogListQuerySchema = z.object({
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  limit: z.number().int().min(1).max(500).optional(),
  offset: z.number().int().min(0).optional(),
});
export type AuditLogListQuery = z.infer<typeof AuditLogListQuerySchema>;

export const OrgSettingsSchema = z.object({
  id: z.literal("default"),
  categories: z.array(z.string().min(1)),
  locations: z.array(z.string().min(1)),
  slaHoursByPriority: z.object({
    Critical: z.number().min(1),
    High: z.number().min(1),
    Medium: z.number().min(1),
    Low: z.number().min(1),
  }),
  notifications: z.object({
    emailEnabled: z.boolean(),
    inAppEnabled: z.boolean(),
    webhookEnabled: z.boolean(),
  }),
});
export type OrgSettings = z.infer<typeof OrgSettingsSchema>;

export const OrgSettingsUpdateSchema = OrgSettingsSchema.omit({ id: true }).partial();
export type OrgSettingsUpdateInput = z.infer<typeof OrgSettingsUpdateSchema>;
