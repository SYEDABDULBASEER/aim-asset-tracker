import { isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { firestoreListAllAssets, firestoreSeedAssets } from "@/lib/firebase/assets.firestore";
import { shouldUseInMemoryStore, requireProductionPersistence } from "@/lib/firebase/production-persistence";
import type { Asset } from "@/lib/models";
import { buildSeedAssets } from "./seed.assets";
import { getStore, syncBook1AssetsIntoStore } from "./store.server";

let book1AutoSeedPromise: Promise<void> | null = null;

async function ensureBook1AssetsInFirestore(): Promise<void> {
  if (!isFirebaseAdminConfigured()) return;
  if (book1AutoSeedPromise) return book1AutoSeedPromise;

  book1AutoSeedPromise = (async () => {
    const existing = await firestoreListAllAssets();
    if (existing.length > 0) return;
    const assets = buildSeedAssets();
    await firestoreSeedAssets(assets);
  })().finally(() => {
    book1AutoSeedPromise = null;
  });

  return book1AutoSeedPromise;
}

export async function loadAllAssets(): Promise<Asset[]> {
  requireProductionPersistence();
  if (!shouldUseInMemoryStore()) {
    await ensureBook1AssetsInFirestore();
    return firestoreListAllAssets();
  }
  const store = getStore();
  syncBook1AssetsIntoStore(store);
  return Array.from(store.assets.values());
}
