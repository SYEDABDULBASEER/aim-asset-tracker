import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { appendAuditLog } from "@/lib/audit/write-audit";
import { matchesWarrantyBand } from "@/lib/asset-warranty";
import { requireRead, requireRole, requireWrite } from "@/lib/auth/require-auth";
import { shouldUseInMemoryStore } from "@/lib/firebase/production-persistence";
import {
  firestoreDeleteAsset,
  firestoreGetAssetById,
  firestoreSeedAssets,
  firestoreUpsertAsset,
} from "@/lib/firebase/assets.firestore";
import {
  AssetCreateSchema,
  AssetImportSchema,
  AssetListQuerySchema,
  AssetSchema,
  AssetUpdateSchema,
} from "@/lib/models";
import { loadAllAssets } from "./assets-source.server";
import { getStore } from "./store.server";
import { seedAllDemoDataToFirestore } from "./seed-firestore.server";

function parseAssetInput(data: z.infer<typeof AssetCreateSchema>) {
  return AssetSchema.parse({
    ...data,
    id: data.id.trim(),
    assignedTo: data.assignedTo ?? null,
    // Treat empty-string department (common in CSV) as null/Unassigned.
    department: data.department && data.department.trim() ? data.department.trim() : null,
    warrantyUntil: data.warrantyUntil ?? null,
    lastServiceAt: data.lastServiceAt ?? null,
    serial: data.serial ?? null,
    location: data.location ?? null,
    purchaseDate: data.purchaseDate ?? null,
    specifications: data.specifications?.trim() ? data.specifications.trim() : null,
  });
}

export const listAssets = createServerFn({ method: "GET" })
  .inputValidator(AssetListQuerySchema.optional())
  .handler(async ({ data }) => {
    requireRead("assets");
    const all = await loadAllAssets();
    const q = (data?.q ?? "").trim().toLowerCase();

    const filtered = all
      .filter((a) => {
        if (q) {
          const hay =
            `${a.id} ${a.name} ${a.assignedTo ?? ""} ${a.department ?? ""} ${a.serial ?? ""} ${a.specifications ?? ""}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        if (data?.status && a.status !== data.status) return false;
        if (data?.category && a.category !== data.category) return false;
        if (data?.department && (a.department ?? "") !== data.department) return false;
        if (data?.warrantyBand && !matchesWarrantyBand(a, data.warrantyBand)) return false;
        return true;
      })
      .sort((a, b) => a.id.localeCompare(b.id));

    const offset = data?.offset ?? 0;
    const limit = data?.limit ?? 50;
    const page = filtered.slice(offset, offset + limit);

    return {
      items: page.flatMap((asset) => {
        const parsed = AssetSchema.safeParse(asset);
        return parsed.success ? [parsed.data] : [];
      }),
      total: filtered.length,
      offset,
      limit,
    };
  });

export const getAssetById = createServerFn({ method: "GET" })
  .inputValidator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => {
    requireRead("assets");
    if (!shouldUseInMemoryStore()) {
      return firestoreGetAssetById(data.id);
    }
    const asset = getStore().assets.get(data.id);
    return asset ? AssetSchema.parse(asset) : null;
  });

export const createAsset = createServerFn({ method: "POST" })
  .inputValidator(AssetCreateSchema)
  .handler(async ({ data }) => {
    const auth = requireWrite("assets");
    const asset = parseAssetInput(data);
    if (!shouldUseInMemoryStore()) {
      const existing = await firestoreGetAssetById(asset.id);
      if (existing) throw new Error(`Asset already exists: ${asset.id}`);
      const saved = await firestoreUpsertAsset(asset);
      await appendAuditLog({
        actorUid: auth.uid,
        actorEmail: auth.email,
        action: "asset.create",
        entityType: "asset",
        entityId: saved.id,
      });
      return saved;
    }
    const store = getStore();
    if (store.assets.has(asset.id)) {
      throw new Error(`Asset already exists: ${asset.id}`);
    }
    store.assets.set(asset.id, asset);
    await appendAuditLog({
      actorUid: auth.uid,
      actorEmail: auth.email,
      action: "asset.create",
      entityType: "asset",
      entityId: asset.id,
    });
    return asset;
  });

export const updateAsset = createServerFn({ method: "POST" })
  .inputValidator(AssetUpdateSchema)
  .handler(async ({ data }) => {
    const auth = requireWrite("assets");
    if (!shouldUseInMemoryStore()) {
      const prev = await firestoreGetAssetById(data.id);
      if (!prev) return null;
      const next = AssetSchema.parse({ ...prev, ...data });
      const saved = await firestoreUpsertAsset(next);
      await appendAuditLog({
        actorUid: auth.uid,
        actorEmail: auth.email,
        action: "asset.update",
        entityType: "asset",
        entityId: saved.id,
      });
      return saved;
    }
    const store = getStore();
    const prev = store.assets.get(data.id);
    if (!prev) return null;
    const next = AssetSchema.parse({ ...prev, ...data });
    store.assets.set(next.id, next);
    await appendAuditLog({
      actorUid: auth.uid,
      actorEmail: auth.email,
      action: "asset.update",
      entityType: "asset",
      entityId: next.id,
    });
    return next;
  });

export const deleteAsset = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => {
    const auth = requireRole("admin");
    if (!shouldUseInMemoryStore()) {
      const existed = await firestoreGetAssetById(data.id);
      if (existed) await firestoreDeleteAsset(data.id);
      if (existed) {
        await appendAuditLog({
          actorUid: auth.uid,
          actorEmail: auth.email,
          action: "asset.delete",
          entityType: "asset",
          entityId: data.id,
        });
      }
      return { ok: Boolean(existed) };
    }
    const existed = getStore().assets.delete(data.id);
    if (existed) {
      await appendAuditLog({
        actorUid: auth.uid,
        actorEmail: auth.email,
        action: "asset.delete",
        entityType: "asset",
        entityId: data.id,
      });
    }
    return { ok: existed };
  });

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export const exportAssetsCsv = createServerFn({ method: "GET" }).handler(async () => {
  requireRead("assets");
  const all = await loadAllAssets();
  const header = [
    "id",
    "name",
    "category",
    "assignedTo",
    "department",
    "status",
    "warrantyUntil",
    "lastServiceAt",
    "serial",
    "location",
    "purchaseDate",
    "specifications",
  ];
  const lines = [
    header.join(","),
    ...all.map((a) =>
      header.map((key) => csvEscape(String(a[key as keyof typeof a] ?? ""))).join(","),
    ),
  ];
  return { csv: lines.join("\n"), filename: "assets-export.csv" };
});

export const importAssetsBulk = createServerFn({ method: "POST" })
  .inputValidator(AssetImportSchema)
  .handler(async ({ data }) => {
    const auth = requireWrite("assets");
    const created: string[] = [];
    const updated: string[] = [];
    const skipped: string[] = [];
    const errors: string[] = [];

    for (const row of data.rows) {
      try {
        const parsed = AssetCreateSchema.parse(row);
        const asset = parseAssetInput(parsed);
        if (!shouldUseInMemoryStore()) {
          const existing = await firestoreGetAssetById(asset.id);
          if (existing) {
            const next = AssetSchema.parse({ ...existing, ...asset });
            await firestoreUpsertAsset(next);
            updated.push(asset.id);
            continue;
          }
          await firestoreUpsertAsset(asset);
          created.push(asset.id);
          continue;
        }
        const store = getStore();
        const existing = store.assets.get(asset.id);
        if (existing) {
          const next = AssetSchema.parse({ ...existing, ...asset });
          store.assets.set(asset.id, next);
          updated.push(asset.id);
          continue;
        }
        store.assets.set(asset.id, asset);
        created.push(asset.id);
      } catch (e) {
        errors.push(e instanceof Error ? e.message : "Import row failed");
      }
    }

    if (created.length > 0 || updated.length > 0) {
      await appendAuditLog({
        actorUid: auth.uid,
        actorEmail: auth.email,
        action: "asset.import",
        entityType: "asset",
        entityId: "bulk",
        metadata: {
          createdCount: created.length,
          updatedCount: updated.length,
          skippedCount: skipped.length,
        },
      });
    }

    return { created, updated, skipped, errors };
  });

export const getAssetQrPayload = createServerFn({ method: "GET" })
  .inputValidator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => {
    requireRead("assets");
    const asset = !shouldUseInMemoryStore()
      ? await firestoreGetAssetById(data.id)
      : (getStore().assets.get(data.id) ?? null);
    if (!asset) return null;
    return {
      assetId: asset.id,
      label: asset.name,
      path: `/assets/${asset.id}`,
      payload: `assetdesk://${asset.id}`,
    };
  });

export const seedFirestoreDemoData = createServerFn({ method: "POST" }).handler(async () => {
  const auth = requireRole("admin");
  if (import.meta.env.PROD) {
    throw new Error("Demo seed is disabled in production builds.");
  }
  const { written, message } = await seedAllDemoDataToFirestore();
  await appendAuditLog({
    actorUid: auth.uid,
    actorEmail: auth.email,
    action: "seed.demo",
    entityType: "system",
    entityId: "firestore",
    metadata: { written },
  });
  return { written, message };
});
