import { VendorSchema } from "@/lib/models";
import { FIRESTORE_VENDORS_COLLECTION } from "./env";
import { createFirestoreDocumentStore } from "./document-store";

const store = createFirestoreDocumentStore(FIRESTORE_VENDORS_COLLECTION, VendorSchema);

export const firestoreListAllVendors = store.listAll;
export const firestoreGetVendorById = store.getById;
export const firestoreUpsertVendor = store.upsert;
export const firestoreDeleteVendor = store.remove;
export const firestoreSeedVendors = store.seed;
