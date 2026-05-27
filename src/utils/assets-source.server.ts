import type { Asset } from "@/lib/models";
import { isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { firestoreListAllAssets } from "@/lib/firebase/assets.firestore";
import {
  shouldUseInMemoryStore,
  requireProductionPersistence,
} from "@/lib/firebase/production-persistence";
import { getStore } from "./store.server";

export async function loadAllAssets(): Promise<Asset[]> {
  requireProductionPersistence();
  if (!shouldUseInMemoryStore()) {
    if (!isFirebaseAdminConfigured()) {
      throw new Error(
        "Firebase Admin SDK is not available on the server. Set FIREBASE_SERVICE_ACCOUNT_PATH in .env to your service account JSON file (e.g. ./aim-asset-tracker-firebase-adminsdk-….json) and restart npm run dev.",
      );
    }
    return firestoreListAllAssets();
  }
  return Array.from(getStore().assets.values());
}
