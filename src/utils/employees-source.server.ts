import { shouldUseInMemoryStore, requireProductionPersistence } from "@/lib/firebase/production-persistence";
import type { Employee } from "@/lib/models";
import { firestoreListAllEmployees } from "@/lib/firebase/employees.firestore";
import { getStore } from "./store.server";

export async function loadAllEmployees(): Promise<Employee[]> {
  requireProductionPersistence();
  if (!shouldUseInMemoryStore()) {
    return firestoreListAllEmployees();
  }
  return Array.from(getStore().employees.values());
}
