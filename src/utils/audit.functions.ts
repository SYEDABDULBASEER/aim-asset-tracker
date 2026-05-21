import { createServerFn } from "@tanstack/react-start";
import { AuditLogListQuerySchema, AuditLogEntrySchema } from "@/lib/models";
import { listAllAuditLogs } from "@/lib/audit/write-audit";
import { requireRead } from "@/lib/auth/require-auth";

export const listAuditLogs = createServerFn({ method: "GET" })
  .inputValidator(AuditLogListQuerySchema.optional())
  .handler(async ({ data }) => {
    requireRead("audit");
    const all = await listAllAuditLogs();
    const filtered = all
      .filter((entry) => {
        if (data?.entityType && entry.entityType !== data.entityType) return false;
        if (data?.entityId && entry.entityId !== data.entityId) return false;
        return true;
      })
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));

    const offset = data?.offset ?? 0;
    const limit = data?.limit ?? 100;
    const page = filtered.slice(offset, offset + limit);
    return {
      items: page.map((entry) => AuditLogEntrySchema.parse(entry)),
      total: filtered.length,
      offset,
      limit,
    };
  });
