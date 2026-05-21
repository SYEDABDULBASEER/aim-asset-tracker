import type { Asset } from "@/lib/models";
import { isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import {
  firestoreListAllAssets,
  firestoreSyncAssetsExact,
} from "@/lib/firebase/assets.firestore";
import { shouldUseInMemoryStore, requireProductionPersistence } from "@/lib/firebase/production-persistence";
import { buildSeedAssets } from "./seed.assets";
import { getStore, replaceStoreAssetsWithSeed } from "./store.server";

let assetsAutoSeedPromise: Promise<void> | null = null;

/** Firestore: only the 36 workbook PCs; delete legacy Book1/demo asset documents. */
async function ensureWorkbookAssetsInFirestore(): Promise<void> {
  if (!isFirebaseAdminConfigured()) return;
  if (assetsAutoSeedPromise) return assetsAutoSeedPromise;

  assetsAutoSeedPromise = (async () => {
    const seedAssets = buildSeedAssets();
    if (seedAssets.length === 0) return;
    await firestoreSyncAssetsExact(seedAssets);
  })().finally(() => {
    assetsAutoSeedPromise = null;
  });

  return assetsAutoSeedPromise;
}

export async function loadAllAssets(): Promise<Asset[]> {
  requireProductionPersistence();
  const seedAssets = buildSeedAssets();
  if (!shouldUseInMemoryStore()) {
    if (!isFirebaseAdminConfigured()) {
      throw new Error(
        "Firebase Admin SDK is not available on the server. Set FIREBASE_SERVICE_ACCOUNT_PATH in .env to your service account JSON file (e.g. ./aim-asset-tracker-firebase-adminsdk-….json) and restart npm run dev.",
      );
    }
    await ensureWorkbookAssetsInFirestore();
    const all = await firestoreListAllAssets();
    const seedIds = new Set(seedAssets.map((a) => a.id));
    return all.filter((a) => seedIds.has(a.id));
  }
  const store = getStore();
  replaceStoreAssetsWithSeed(store);
  return seedAssets;
}
