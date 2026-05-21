import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { appendAuditLog } from "@/lib/audit/write-audit";
import { requireRead, requireWrite } from "@/lib/auth/require-auth";
import { shouldUseInMemoryStore } from "@/lib/firebase/production-persistence";
import {
  firestoreGetAssetById,
  firestoreUpsertAsset,
} from "@/lib/firebase/assets.firestore";
import {
  firestoreGetMaintenanceJobById,
  firestoreUpsertMaintenanceJob,
} from "@/lib/firebase/maintenance.firestore";
import {
  AssetSchema,
  MaintenanceJobCreateInputSchema,
  MaintenanceJobSchema,
  MaintenanceJobUpdateSchema,
  MaintenanceListQuerySchema,
  type MaintenanceJob,
} from "@/lib/models";
import { loadAllAssets } from "./assets-source.server";
import { loadAllMaintenanceJobs } from "./maintenance-source.server";
import { getStore } from "./store.server";

function newMaintenanceId(): string {
  const part = crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
  return `MNT-${part}`;
}

async function syncAssetForMaintenanceJob(job: MaintenanceJob): Promise<void> {
  async function loadAsset() {
    if (!shouldUseInMemoryStore()) return firestoreGetAssetById(job.assetId);
    return getStore().assets.get(job.assetId) ?? null;
  }

  const asset = await loadAsset();
  if (!asset) return;

  const now = new Date().toISOString();
  let next = asset;

  if (job.status === "Completed") {
    next = AssetSchema.parse({
      ...asset,
      lastServiceAt: now,
      status: job.type === "Repair" && asset.status === "In Repair" ? "Active" : asset.status,
    });
  } else if (job.type === "Repair" && job.status === "In Progress") {
    next = AssetSchema.parse({
      ...asset,
      status: "In Repair",
    });
  } else {
    return;
  }

  if (!shouldUseInMemoryStore()) {
    await firestoreUpsertAsset(next);
    return;
  }
  getStore().assets.set(next.id, next);
}

export const listMaintenanceJobs = createServerFn({ method: "GET" })
  .inputValidator(MaintenanceListQuerySchema.optional())
  .handler(async ({ data }) => {
    requireRead("maintenance");
    const all = await loadAllMaintenanceJobs();
    const q = (data?.q ?? "").trim().toLowerCase();

    const filtered = all.filter((j) => {
      if (q) {
        const hay = `${j.id} ${j.assetId} ${j.vendor} ${j.type}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (data?.status && j.status !== data.status) return false;
      if (data?.assetId && j.assetId !== data.assetId) return false;
      return true;
    });

    filtered.sort((a, b) =>
      a.scheduledAt < b.scheduledAt ? 1 : a.scheduledAt > b.scheduledAt ? -1 : 0,
    );

    const offset = data?.offset ?? 0;
    const limit = data?.limit ?? 100;
    const page = filtered.slice(offset, offset + limit);

    return {
      items: page.map((x) => MaintenanceJobSchema.parse(x)),
      total: filtered.length,
      offset,
      limit,
    };
  });

export const createMaintenanceJob = createServerFn({ method: "POST" })
  .inputValidator(MaintenanceJobCreateInputSchema)
  .handler(async ({ data }) => {
    const auth = requireWrite("maintenance");
    const assets = await loadAllAssets();
    if (!assets.some((a) => a.id === data.assetId)) {
      throw new Error(`Unknown asset id: ${data.assetId}`);
    }

    const job = MaintenanceJobSchema.parse({
      id: newMaintenanceId(),
      assetId: data.assetId,
      type: data.type,
      vendor: data.vendor.trim(),
      vendorId: data.vendorId ?? null,
      scheduledAt: data.scheduledAt,
      status: "Scheduled",
      notes: data.notes?.trim() || null,
    });

    if (!shouldUseInMemoryStore()) {
      const saved = await firestoreUpsertMaintenanceJob(job);
      await appendAuditLog({
        actorUid: auth.uid,
        actorEmail: auth.email,
        action: "maintenance.create",
        entityType: "maintenance",
        entityId: saved.id,
      });
      return saved;
    }
    getStore().maintenanceJobs.set(job.id, job);
    await appendAuditLog({
      actorUid: auth.uid,
      actorEmail: auth.email,
      action: "maintenance.create",
      entityType: "maintenance",
      entityId: job.id,
    });
    return job;
  });

export const updateMaintenanceJob = createServerFn({ method: "POST" })
  .inputValidator(MaintenanceJobUpdateSchema)
  .handler(async ({ data }) => {
    const auth = requireWrite("maintenance");
    const { id, ...patch } = data;

    async function loadPrev(): Promise<MaintenanceJob | null> {
      if (!shouldUseInMemoryStore()) return firestoreGetMaintenanceJobById(id);
      return getStore().maintenanceJobs.get(id) ?? null;
    }

    const prev = await loadPrev();
    if (!prev) return null;

    const next = MaintenanceJobSchema.parse({ ...prev, ...patch, id: prev.id });
    let saved = next;
    if (!shouldUseInMemoryStore()) {
      saved = await firestoreUpsertMaintenanceJob(next);
    } else {
      getStore().maintenanceJobs.set(next.id, next);
    }

    if (patch.status !== undefined && patch.status !== prev.status) {
      await syncAssetForMaintenanceJob(next);
    }

    await appendAuditLog({
      actorUid: auth.uid,
      actorEmail: auth.email,
      action: "maintenance.update",
      entityType: "maintenance",
      entityId: next.id,
    });
    return saved;
  });

export const getMaintenanceJobById = createServerFn({ method: "GET" })
  .inputValidator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => {
    requireRead("maintenance");
    if (!shouldUseInMemoryStore()) {
      return firestoreGetMaintenanceJobById(data.id);
    }
    const job = getStore().maintenanceJobs.get(data.id);
    return job ? MaintenanceJobSchema.parse(job) : null;
  });
