import { AuditLogEntrySchema, type AuditLogEntry } from "@/lib/models";
import { FIRESTORE_AUDIT_LOGS_COLLECTION } from "@/lib/firebase/env";
import { createAdminDocumentStore } from "@/lib/firebase/admin-document-store";
import { isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { getStore } from "@/utils/store.server";

const adminStore = createAdminDocumentStore(FIRESTORE_AUDIT_LOGS_COLLECTION, AuditLogEntrySchema);

function newAuditId(): string {
  const part = crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase();
  return `AUD-${part}`;
}

export async function appendAuditLog(input: {
  actorUid: string;
  actorEmail: string | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown> | null;
}): Promise<AuditLogEntry> {
  const entry = AuditLogEntrySchema.parse({
    id: newAuditId(),
    actorUid: input.actorUid,
    actorEmail: input.actorEmail,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    createdAt: new Date().toISOString(),
    metadata: input.metadata ?? null,
  });

  if (isFirebaseAdminConfigured()) {
    return adminStore.upsert(entry);
  }

  getStore().auditLogs.set(entry.id, entry);
  return entry;
}

export async function listAllAuditLogs(): Promise<AuditLogEntry[]> {
  if (isFirebaseAdminConfigured()) {
    return adminStore.listAll();
  }
  return Array.from(getStore().auditLogs.values());
}
