import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { listAllAuditLogs } from "@/lib/audit/write-audit";
import {
  ADMIN_ALLOCATION_PATH,
  ADMIN_ASSETS_PATH,
  ADMIN_EMPLOYEES_PATH,
  ADMIN_MAINTENANCE_PATH,
  ADMIN_SETTINGS_PATH,
  ADMIN_TICKETS_PATH,
  ADMIN_VENDORS_PATH,
} from "@/lib/auth/routing";
import { requireRead } from "@/lib/auth/require-auth";

const NotificationFeedInputSchema = z.object({
  limit: z.number().int().min(1).max(50).optional(),
});

export type NotificationFeedLink =
  | { to: "/admin/assets/$id"; params: { id: string } }
  | { to: "/admin/tickets" }
  | { to: "/admin/vendors" }
  | { to: "/admin/employees" }
  | { to: "/admin/allocation" }
  | { to: "/admin/maintenance" }
  | { to: "/admin/settings" };

export type NotificationFeedItem = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  actorLabel: string;
  createdAt: string;
  link: NotificationFeedLink | null;
};

function linkForAudit(entry: {
  entityType: string;
  entityId: string;
}): NotificationFeedLink | null {
  switch (entry.entityType) {
    case "asset":
      return { to: "/admin/assets/$id", params: { id: entry.entityId } };
    case "ticket":
      return { to: ADMIN_TICKETS_PATH };
    case "vendor":
      return { to: ADMIN_VENDORS_PATH };
    case "employee":
      return { to: ADMIN_EMPLOYEES_PATH };
    case "transfer":
      return { to: ADMIN_ALLOCATION_PATH };
    case "maintenance":
      return { to: ADMIN_MAINTENANCE_PATH };
    case "orgSettings":
      return { to: ADMIN_SETTINGS_PATH };
    default:
      return null;
  }
}

/** Recent audit activity for the header notifications panel (requires reports read, same as dashboard). */
export const getNotificationFeed = createServerFn({ method: "GET" })
  .inputValidator(NotificationFeedInputSchema.optional())
  .handler(async ({ data }) => {
    await requireRead("reports");
    const limit = data?.limit ?? 30;
    const logs = (await listAllAuditLogs()).slice(0, limit);
    return {
      items: logs.map((entry) => ({
        id: entry.id,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        actorLabel: entry.actorEmail ?? entry.actorUid,
        createdAt: entry.createdAt,
        link: linkForAudit(entry),
      })) satisfies NotificationFeedItem[],
    };
  });
