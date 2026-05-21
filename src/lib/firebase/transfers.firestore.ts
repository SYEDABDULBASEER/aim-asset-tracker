import type { Transfer } from "@/lib/models";
import { TransferSchema } from "@/lib/models";
import { FIRESTORE_TRANSFERS_COLLECTION } from "./env";
import { createFirestoreDocumentStore } from "./document-store";

const store = createFirestoreDocumentStore(FIRESTORE_TRANSFERS_COLLECTION, TransferSchema);

export const firestoreListAllTransfers = store.listAll;
export const firestoreGetTransferById = store.getById;
export const firestoreUpsertTransfer = store.upsert;
export const firestoreDeleteTransfer = store.remove;
export const firestoreSeedTransfers = store.seed;

export async function firestoreSyncTransfersExact(
  transfers: Transfer[],
): Promise<{ written: number; removed: number }> {
  const rosterIds = new Set(transfers.map((t) => t.id));
  const existing = await firestoreListAllTransfers();
  let removed = 0;
  for (const item of existing) {
    if (rosterIds.has(item.id)) continue;
    await firestoreDeleteTransfer(item.id);
    removed += 1;
  }
  const { written } = await firestoreSeedTransfers(transfers);
  return { written, removed };
}
