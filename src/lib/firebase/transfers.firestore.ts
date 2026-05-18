import { TransferSchema } from "@/lib/models";
import { FIRESTORE_TRANSFERS_COLLECTION } from "./env";
import { createFirestoreDocumentStore } from "./document-store";

const store = createFirestoreDocumentStore(FIRESTORE_TRANSFERS_COLLECTION, TransferSchema);

export const firestoreListAllTransfers = store.listAll;
export const firestoreGetTransferById = store.getById;
export const firestoreUpsertTransfer = store.upsert;
export const firestoreDeleteTransfer = store.remove;
export const firestoreSeedTransfers = store.seed;
