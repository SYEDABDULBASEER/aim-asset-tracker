import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { appendAuditLog } from "@/lib/audit/write-audit";
import { requireRead, requireWrite } from "@/lib/auth/require-auth";
import { shouldUseInMemoryStore } from "@/lib/firebase/production-persistence";
import {
  firestoreGetAssetById,
  firestoreUpsertAsset,
} from "@/lib/firebase/assets.firestore";
import { firestoreGetEmployeeById } from "@/lib/firebase/employees.firestore";
import {
  firestoreGetTransferById,
  firestoreUpsertTransfer,
} from "@/lib/firebase/transfers.firestore";
import {
  AssetSchema,
  TransferCreateInputSchema,
  TransferListQuerySchema,
  TransferSchema,
  TransferStatusUpdateSchema,
  type Transfer,
} from "@/lib/models";
import { loadAllAssets } from "./assets-source.server";
import { loadAllTransfers } from "./transfers-source.server";
import { getStore } from "./store.server";

function newTransferId(): string {
  const part = crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
  return `TRF-${part}`;
}

async function applyApprovedTransferAssetUpdate(transfer: Transfer): Promise<void> {
  async function loadAsset() {
    if (!shouldUseInMemoryStore()) return firestoreGetAssetById(transfer.assetId);
    return getStore().assets.get(transfer.assetId) ?? null;
  }

  async function loadEmployee(id: string) {
    if (!shouldUseInMemoryStore()) return firestoreGetEmployeeById(id);
    return getStore().employees.get(id) ?? null;
  }

  const asset = await loadAsset();
  if (!asset) return;

  let assignedTo = transfer.toParty;
  let department = asset.department;
  if (transfer.toEmployeeId) {
    const employee = await loadEmployee(transfer.toEmployeeId);
    if (employee) {
      assignedTo = employee.name;
      department = employee.department;
    }
  }

  const next = AssetSchema.parse({
    ...asset,
    assignedTo,
    department,
  });

  if (!shouldUseInMemoryStore()) {
    await firestoreUpsertAsset(next);
    return;
  }
  getStore().assets.set(next.id, next);
}

export const listTransfers = createServerFn({ method: "GET" })
  .inputValidator(TransferListQuerySchema.optional())
  .handler(async ({ data }) => {
    requireRead("transfers");
    const all = await loadAllTransfers();
    const q = (data?.q ?? "").trim().toLowerCase();

    const filtered = all.filter((t) => {
      if (q) {
        const hay = `${t.id} ${t.assetId} ${t.fromParty} ${t.toParty}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (data?.status && t.status !== data.status) return false;
      if (data?.assetId && t.assetId !== data.assetId) return false;
      return true;
    });

    filtered.sort((a, b) =>
      a.requestedAt < b.requestedAt ? 1 : a.requestedAt > b.requestedAt ? -1 : 0,
    );

    const offset = data?.offset ?? 0;
    const limit = data?.limit ?? 100;
    const page = filtered.slice(offset, offset + limit);

    return {
      items: page.map((x) => TransferSchema.parse(x)),
      total: filtered.length,
      offset,
      limit,
    };
  });

export const createTransfer = createServerFn({ method: "POST" })
  .inputValidator(TransferCreateInputSchema)
  .handler(async ({ data }) => {
    const auth = requireWrite("transfers");
    const assets = await loadAllAssets();
    if (!assets.some((a) => a.id === data.assetId)) {
      throw new Error(`Unknown asset id: ${data.assetId}`);
    }

    const now = new Date().toISOString();
    const transfer = TransferSchema.parse({
      id: newTransferId(),
      assetId: data.assetId,
      fromParty: data.fromParty.trim(),
      toParty: data.toParty.trim(),
      fromEmployeeId: data.fromEmployeeId ?? null,
      toEmployeeId: data.toEmployeeId ?? null,
      status: "Pending",
      requestedAt: now,
      notes: data.notes?.trim() || null,
    });

    if (!shouldUseInMemoryStore()) {
      const saved = await firestoreUpsertTransfer(transfer);
      await appendAuditLog({
        actorUid: auth.uid,
        actorEmail: auth.email,
        action: "transfer.create",
        entityType: "transfer",
        entityId: saved.id,
      });
      return saved;
    }
    getStore().transfers.set(transfer.id, transfer);
    await appendAuditLog({
      actorUid: auth.uid,
      actorEmail: auth.email,
      action: "transfer.create",
      entityType: "transfer",
      entityId: transfer.id,
    });
    return transfer;
  });

export const updateTransferStatus = createServerFn({ method: "POST" })
  .inputValidator(TransferStatusUpdateSchema)
  .handler(async ({ data }) => {
    const auth = requireWrite("transfers");

    async function loadPrev(): Promise<Transfer | null> {
      if (!shouldUseInMemoryStore()) return firestoreGetTransferById(data.id);
      return getStore().transfers.get(data.id) ?? null;
    }

    const prev = await loadPrev();
    if (!prev) return null;

    const next = TransferSchema.parse({ ...prev, status: data.status });
    let saved = next;
    if (!shouldUseInMemoryStore()) {
      saved = await firestoreUpsertTransfer(next);
    } else {
      getStore().transfers.set(next.id, next);
    }

    if (data.status === "Approved" && prev.status !== "Approved") {
      await applyApprovedTransferAssetUpdate(next);
    }

    await appendAuditLog({
      actorUid: auth.uid,
      actorEmail: auth.email,
      action: "transfer.status",
      entityType: "transfer",
      entityId: next.id,
      metadata: { status: data.status },
    });
    return saved;
  });

export const getTransferById = createServerFn({ method: "GET" })
  .inputValidator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => {
    requireRead("transfers");
    if (!shouldUseInMemoryStore()) {
      return firestoreGetTransferById(data.id);
    }
    const transfer = getStore().transfers.get(data.id);
    return transfer ? TransferSchema.parse(transfer) : null;
  });
