import type { Asset } from "@/lib/models";
import { AssetSchema } from "@/lib/models";
import { createAdminDocumentStore } from "./admin-document-store";
import { isFirebaseAdminConfigured } from "./admin";
import { FIRESTORE_ASSETS_COLLECTION } from "./env";
import { getFirestoreDb } from "./init";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  writeBatch,
} from "firebase/firestore";

const adminStore = createAdminDocumentStore(FIRESTORE_ASSETS_COLLECTION, AssetSchema);

function assetToFirestoreFields(a: Asset): Record<string, unknown> {
  return JSON.parse(JSON.stringify(a)) as Record<string, unknown>;
}

export async function firestoreListAllAssets(): Promise<Asset[]> {
  if (isFirebaseAdminConfigured()) {
    return adminStore.listAll();
  }
  const db = getFirestoreDb();
  const snap = await getDocs(collection(db, FIRESTORE_ASSETS_COLLECTION));
  const out: Asset[] = [];
  snap.forEach((d) => {
    const parsed = AssetSchema.safeParse({ id: d.id, ...d.data() });
    if (parsed.success) out.push(parsed.data);
  });
  return out;
}

export async function firestoreGetAssetById(id: string): Promise<Asset | null> {
  if (isFirebaseAdminConfigured()) {
    return adminStore.getById(id);
  }
  const db = getFirestoreDb();
  const ref = doc(db, FIRESTORE_ASSETS_COLLECTION, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const parsed = AssetSchema.safeParse({ id: snap.id, ...snap.data() });
  return parsed.success ? parsed.data : null;
}

export async function firestoreUpsertAsset(asset: Asset): Promise<Asset> {
  if (isFirebaseAdminConfigured()) {
    return adminStore.upsert(asset);
  }
  const db = getFirestoreDb();
  const validated = AssetSchema.parse(asset);
  await setDoc(
    doc(db, FIRESTORE_ASSETS_COLLECTION, validated.id),
    assetToFirestoreFields(validated),
  );
  return validated;
}

export async function firestoreDeleteAsset(id: string): Promise<boolean> {
  if (isFirebaseAdminConfigured()) {
    return adminStore.remove(id);
  }
  const db = getFirestoreDb();
  await deleteDoc(doc(db, FIRESTORE_ASSETS_COLLECTION, id));
  return true;
}

const BATCH_SIZE = 400;

/** Keep only workbook PCs: remove Firestore assets not in the list, then upsert the list. */
export async function firestoreSyncAssetsExact(
  assets: Asset[],
): Promise<{ written: number; removed: number }> {
  const seedIds = new Set(assets.map((a) => a.id));
  const existing = await firestoreListAllAssets();
  let removed = 0;
  for (const item of existing) {
    if (seedIds.has(item.id)) continue;
    await firestoreDeleteAsset(item.id);
    removed += 1;
  }
  const { written } = await firestoreSeedAssets(assets);
  return { written, removed };
}

export async function firestoreSeedAssets(assets: Asset[]): Promise<{ written: number }> {
  if (isFirebaseAdminConfigured()) {
    return adminStore.seed(assets);
  }
  const db = getFirestoreDb();
  let written = 0;
  for (let i = 0; i < assets.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    const chunk = assets.slice(i, i + BATCH_SIZE);
    for (const a of chunk) {
      const validated = AssetSchema.parse(a);
      batch.set(
        doc(db, FIRESTORE_ASSETS_COLLECTION, validated.id),
        assetToFirestoreFields(validated),
      );
      written += 1;
    }
    await batch.commit();
  }
  return { written };
}
