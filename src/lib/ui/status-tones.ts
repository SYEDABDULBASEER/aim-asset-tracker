import type {
  AssetStatus,
  MaintenanceStatus,
  TicketPriority,
  TicketStatus,
  TransferStatus,
} from "@/lib/models";

/** Visual tone for {@link StatusPill} across the app. */
export type StatusPillTone = "success" | "warning" | "info" | "danger" | "muted";

export function ticketPriorityTone(priority: string): StatusPillTone {
  if (priority === "Critical") return "danger";
  if (priority === "High") return "warning";
  if (priority === "Medium") return "info";
  return "muted";
}

export function ticketPriorityToneFromEnum(priority: TicketPriority): StatusPillTone {
  return ticketPriorityTone(priority);
}

export function ticketStatusTone(status: string): StatusPillTone {
  if (status === "Resolved") return "success";
  if (status === "Open" || status === "In Progress") return "info";
  if (status === "Waiting Parts") return "warning";
  if (status === "Closed") return "muted";
  return "info";
}

export function ticketStatusToneFromEnum(status: TicketStatus): StatusPillTone {
  return ticketStatusTone(status);
}

export function transferStatusTone(status: TransferStatus): StatusPillTone {
  if (status === "Approved") return "success";
  if (status === "Pending") return "warning";
  return "danger";
}

export function maintenanceStatusTone(status: MaintenanceStatus): StatusPillTone {
  if (status === "Completed") return "success";
  if (status === "In Progress") return "warning";
  if (status === "Cancelled") return "danger";
  return "info";
}

export function assetStatusTone(status: AssetStatus | string): StatusPillTone {
  if (status === "Active") return "success";
  if (status === "Available") return "info";
  if (status === "In Repair") return "warning";
  if (status === "Lost") return "danger";
  if (status === "Retired") return "muted";
  return "muted";
}

export function vendorSlaTone(slaPercent: number): StatusPillTone {
  if (slaPercent >= 95) return "success";
  if (slaPercent >= 85) return "info";
  return "warning";
}
