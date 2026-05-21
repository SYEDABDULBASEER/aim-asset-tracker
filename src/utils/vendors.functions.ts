import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { appendAuditLog } from "@/lib/audit/write-audit";
import { requireRead, requireWrite } from "@/lib/auth/require-auth";
import { shouldUseInMemoryStore } from "@/lib/firebase/production-persistence";
import {
  firestoreDeleteVendor,
  firestoreGetVendorById,
  firestoreUpsertVendor,
} from "@/lib/firebase/vendors.firestore";
import {
  VendorCreateSchema,
  VendorListQuerySchema,
  VendorSchema,
  VendorUpdateSchema,
} from "@/lib/models";
import { loadAllVendors } from "./vendors-source.server";
import { getStore } from "./store.server";

export const listVendors = createServerFn({ method: "GET" })
  .inputValidator(VendorListQuerySchema.optional())
  .handler(async ({ data }) => {
    requireRead("vendors");
    const all = await loadAllVendors();
    const q = (data?.q ?? "").trim().toLowerCase();

    const filtered = all.filter((v) => {
      if (q) {
        const hay = `${v.id} ${v.name} ${v.category} ${v.contactEmail}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    filtered.sort((a, b) => a.name.localeCompare(b.name));

    const offset = data?.offset ?? 0;
    const limit = data?.limit ?? 100;
    const page = filtered.slice(offset, offset + limit);

    return {
      items: page.map((x) => VendorSchema.parse(x)),
      total: filtered.length,
      offset,
      limit,
    };
  });

export const createVendor = createServerFn({ method: "POST" })
  .inputValidator(VendorCreateSchema)
  .handler(async ({ data }) => {
    const auth = requireWrite("vendors");
    const vendor = VendorSchema.parse(data);
    if (!shouldUseInMemoryStore()) {
      const existing = await firestoreGetVendorById(vendor.id);
      if (existing) throw new Error(`Vendor already exists: ${vendor.id}`);
      const saved = await firestoreUpsertVendor(vendor);
      await appendAuditLog({
        actorUid: auth.uid,
        actorEmail: auth.email,
        action: "vendor.create",
        entityType: "vendor",
        entityId: saved.id,
      });
      return saved;
    }
    const store = getStore();
    if (store.vendors.has(vendor.id)) {
      throw new Error(`Vendor already exists: ${vendor.id}`);
    }
    store.vendors.set(vendor.id, vendor);
    await appendAuditLog({
      actorUid: auth.uid,
      actorEmail: auth.email,
      action: "vendor.create",
      entityType: "vendor",
      entityId: vendor.id,
    });
    return vendor;
  });

export const updateVendor = createServerFn({ method: "POST" })
  .inputValidator(VendorUpdateSchema)
  .handler(async ({ data }) => {
    const auth = requireWrite("vendors");
    if (!shouldUseInMemoryStore()) {
      const prev = await firestoreGetVendorById(data.id);
      if (!prev) return null;
      const next = VendorSchema.parse({ ...prev, ...data });
      const saved = await firestoreUpsertVendor(next);
      await appendAuditLog({
        actorUid: auth.uid,
        actorEmail: auth.email,
        action: "vendor.update",
        entityType: "vendor",
        entityId: saved.id,
      });
      return saved;
    }
    const store = getStore();
    const prev = store.vendors.get(data.id);
    if (!prev) return null;
    const next = VendorSchema.parse({ ...prev, ...data });
    store.vendors.set(next.id, next);
    await appendAuditLog({
      actorUid: auth.uid,
      actorEmail: auth.email,
      action: "vendor.update",
      entityType: "vendor",
      entityId: next.id,
    });
    return next;
  });

export const deleteVendor = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => {
    const auth = requireWrite("vendors");
    if (!shouldUseInMemoryStore()) {
      const existed = await firestoreGetVendorById(data.id);
      if (existed) await firestoreDeleteVendor(data.id);
      if (existed) {
        await appendAuditLog({
          actorUid: auth.uid,
          actorEmail: auth.email,
          action: "vendor.delete",
          entityType: "vendor",
          entityId: data.id,
        });
      }
      return { ok: Boolean(existed) };
    }
    const existed = getStore().vendors.delete(data.id);
    if (existed) {
      await appendAuditLog({
        actorUid: auth.uid,
        actorEmail: auth.email,
        action: "vendor.delete",
        entityType: "vendor",
        entityId: data.id,
      });
    }
    return { ok: existed };
  });
