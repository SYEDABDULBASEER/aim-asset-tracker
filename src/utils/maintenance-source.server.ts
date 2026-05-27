import {
  shouldUseInMemoryStore,
  requireProductionPersistence,
} from "@/lib/firebase/production-persistence";
import type { MaintenanceJob } from "@/lib/models";
import { firestoreListAllMaintenanceJobs } from "@/lib/firebase/maintenance.firestore";
import { getStore } from "./store.server";

export async function loadAllMaintenanceJobs(): Promise<MaintenanceJob[]> {
  requireProductionPersistence();
  if (!shouldUseInMemoryStore()) {
    return firestoreListAllMaintenanceJobs();
  }
  return Array.from(getStore().maintenanceJobs.values());
}
