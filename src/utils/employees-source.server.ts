import { isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { shouldUseInMemoryStore, requireProductionPersistence } from "@/lib/firebase/production-persistence";
import type { Employee } from "@/lib/models";
import {
  firestoreListAllEmployees,
  firestoreSyncEmployeesExact,
} from "@/lib/firebase/employees.firestore";
import { buildSeedEmployees } from "./seed.employees";
import { getStore } from "./store.server";

let employeesAutoSyncPromise: Promise<void> | null = null;

async function ensureRosterEmployeesInFirestore(): Promise<void> {
  if (!isFirebaseAdminConfigured()) return;
  if (employeesAutoSyncPromise) return employeesAutoSyncPromise;

  employeesAutoSyncPromise = (async () => {
    const roster = buildSeedEmployees();
    if (roster.length === 0) return;
    await firestoreSyncEmployeesExact(roster);
  })().finally(() => {
    employeesAutoSyncPromise = null;
  });

  return employeesAutoSyncPromise;
}

export async function loadAllEmployees(): Promise<Employee[]> {
  requireProductionPersistence();
  const roster = buildSeedEmployees();
  if (!shouldUseInMemoryStore()) {
    if (!isFirebaseAdminConfigured()) {
      throw new Error(
        "Firebase Admin SDK is not available on the server. Set FIREBASE_SERVICE_ACCOUNT_PATH in .env to your service account JSON file (e.g. ./aim-asset-tracker-firebase-adminsdk-….json) and restart npm run dev.",
      );
    }
    await ensureRosterEmployeesInFirestore();
    const all = await firestoreListAllEmployees();
    const rosterIds = new Set(roster.map((e) => e.id));
    return all.filter((e) => rosterIds.has(e.id));
  }
  return roster;
}
