import { MaintenanceJobSchema } from "@/lib/models";
import { FIRESTORE_MAINTENANCE_COLLECTION } from "./env";
import { createFirestoreDocumentStore } from "./document-store";

const store = createFirestoreDocumentStore(FIRESTORE_MAINTENANCE_COLLECTION, MaintenanceJobSchema);

export const firestoreListAllMaintenanceJobs = store.listAll;
export const firestoreGetMaintenanceJobById = store.getById;
export const firestoreUpsertMaintenanceJob = store.upsert;
export const firestoreDeleteMaintenanceJob = store.remove;
export const firestoreSeedMaintenanceJobs = store.seed;
