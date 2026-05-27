import { isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import {
  shouldUseInMemoryStore,
  requireProductionPersistence,
} from "@/lib/firebase/production-persistence";
import type { Transfer } from "@/lib/models";
import {
  firestoreListAllTransfers,
  firestoreSyncTransfersExact,
} from "@/lib/firebase/transfers.firestore";
import { buildSeedTransfers } from "./seed.transfers";
import { getStore } from "./store.server";

let transfersAutoSyncPromise: Promise<void> | null = null;

async function ensureRosterTransfersInFirestore(): Promise<void> {
  if (!isFirebaseAdminConfigured()) return;
  if (transfersAutoSyncPromise) return transfersAutoSyncPromise;

  transfersAutoSyncPromise = (async () => {
    const roster = buildSeedTransfers();
    if (roster.length === 0) return;
    await firestoreSyncTransfersExact(roster);
  })().finally(() => {
    transfersAutoSyncPromise = null;
  });

  return transfersAutoSyncPromise;
}

export async function loadAllTransfers(): Promise<Transfer[]> {
  requireProductionPersistence();
  const roster = buildSeedTransfers();
  if (!shouldUseInMemoryStore()) {
    if (!isFirebaseAdminConfigured()) {
      throw new Error(
        "Firebase Admin SDK is not available on the server. Set FIREBASE_SERVICE_ACCOUNT_PATH in .env to your service account JSON file (e.g. ./aim-asset-tracker-firebase-adminsdk-….json) and restart npm run dev.",
      );
    }
    await ensureRosterTransfersInFirestore();
    const all = await firestoreListAllTransfers();
    const rosterIds = new Set(roster.map((t) => t.id));
    return all.filter((t) => rosterIds.has(t.id));
  }
  return roster;
}
