import { createServerFn } from "@tanstack/react-start";
import { OrgSettingsSchema, OrgSettingsUpdateSchema } from "@/lib/models";
import { appendAuditLog } from "@/lib/audit/write-audit";
import { requireRead, requireWrite } from "@/lib/auth/require-auth";
import { FIRESTORE_ORG_SETTINGS_COLLECTION } from "@/lib/firebase/env";
import { createAdminDocumentStore } from "@/lib/firebase/admin-document-store";
import { isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { buildDefaultOrgSettings, getStore } from "./store.server";

const adminStore = createAdminDocumentStore(FIRESTORE_ORG_SETTINGS_COLLECTION, OrgSettingsSchema);

async function loadOrgSettings() {
  if (isFirebaseAdminConfigured()) {
    const existing = await adminStore.getById("default");
    if (existing) return existing;
    const defaults = buildDefaultOrgSettings();
    await adminStore.upsert(defaults);
    return defaults;
  }
  return getStore().orgSettings;
}

export const getOrgSettings = createServerFn({ method: "GET" }).handler(async () => {
  requireRead("settings");
  return loadOrgSettings();
});

export const updateOrgSettings = createServerFn({ method: "POST" })
  .inputValidator(OrgSettingsUpdateSchema)
  .handler(async ({ data }) => {
    const auth = requireWrite("settings");
    const current = await loadOrgSettings();
    const next = OrgSettingsSchema.parse({ ...current, ...data, id: "default" });
    if (isFirebaseAdminConfigured()) {
      await adminStore.upsert(next);
    } else {
      getStore().orgSettings = next;
    }
    await appendAuditLog({
      actorUid: auth.uid,
      actorEmail: auth.email,
      action: "settings.update",
      entityType: "orgSettings",
      entityId: "default",
    });
    return next;
  });
