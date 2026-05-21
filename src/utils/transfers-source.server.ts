import { shouldUseInMemoryStore, requireProductionPersistence } from "@/lib/firebase/production-persistence";
import type { Transfer } from "@/lib/models";
import { firestoreListAllTransfers } from "@/lib/firebase/transfers.firestore";
import { getStore } from "./store.server";

export async function loadAllTransfers(): Promise<Transfer[]> {
  requireProductionPersistence();
  if (!shouldUseInMemoryStore()) {
    return firestoreListAllTransfers();
  }
  return Array.from(getStore().transfers.values());
}
