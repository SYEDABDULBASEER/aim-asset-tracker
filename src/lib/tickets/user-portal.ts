import type { Ticket, TicketStatus } from "@/lib/models";

export type UserTicketSummary = {
  id: string;
  title: string;
  status: TicketStatus;
  priority: Ticket["priority"];
  assetId: string | null;
  assigneeName: string | null;
  createdAt: string;
  updatedAt: string;
};

export function ticketStatusTone(
  status: TicketStatus,
): "success" | "warning" | "info" | "danger" | "muted" {
  if (status === "Resolved") return "success";
  if (status === "Open" || status === "In Progress") return "info";
  if (status === "Waiting Parts") return "warning";
  if (status === "Closed") return "muted";
  return "info";
}

export function normalizeEmail(email: string | null | undefined): string | null {
  const v = email?.trim().toLowerCase();
  return v || null;
}

/** Whether a portal ticket belongs to the signed-in requester. */
export function ticketBelongsToRequester(
  ticket: Ticket,
  requesterEmail: string | null,
  requesterName: string | null,
): boolean {
  if (ticket.openedVia !== "user_portal") return false;

  const ticketEmail = normalizeEmail(ticket.requesterEmail);
  const userEmail = normalizeEmail(requesterEmail);
  if (ticketEmail && userEmail && ticketEmail === userEmail) return true;

  if (!ticketEmail && requesterName && ticket.requesterName) {
    return ticket.requesterName.trim().toLowerCase() === requesterName.trim().toLowerCase();
  }

  return false;
}

export function toUserTicketSummary(ticket: Ticket): UserTicketSummary {
  return {
    id: ticket.id,
    title: ticket.title,
    status: ticket.status,
    priority: ticket.priority,
    assetId: ticket.assetId,
    assigneeName: ticket.assigneeName,
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
  };
}
