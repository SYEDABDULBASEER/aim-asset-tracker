import {
  shouldUseInMemoryStore,
  requireProductionPersistence,
} from "@/lib/firebase/production-persistence";
import type { Vendor } from "@/lib/models";
import { firestoreListAllVendors } from "@/lib/firebase/vendors.firestore";
import { getStore } from "./store.server";

export async function loadAllVendors(): Promise<Vendor[]> {
  requireProductionPersistence();
  if (!shouldUseInMemoryStore()) {
    return firestoreListAllVendors();
  }
  return Array.from(getStore().vendors.values());
}
