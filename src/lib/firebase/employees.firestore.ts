import { EmployeeSchema } from "@/lib/models";
import { FIRESTORE_EMPLOYEES_COLLECTION } from "./env";
import { createFirestoreDocumentStore } from "./document-store";

const store = createFirestoreDocumentStore(FIRESTORE_EMPLOYEES_COLLECTION, EmployeeSchema);

export const firestoreListAllEmployees = store.listAll;
export const firestoreGetEmployeeById = store.getById;
export const firestoreUpsertEmployee = store.upsert;
export const firestoreDeleteEmployee = store.remove;
export const firestoreSeedEmployees = store.seed;
