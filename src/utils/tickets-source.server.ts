import { createAdminDocumentStore } from "@/lib/firebase/admin-document-store";
import { isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { FIRESTORE_TICKETS_COLLECTION } from "@/lib/firebase/env";
import { shouldUseInMemoryStore, requireProductionPersistence } from "@/lib/firebase/production-persistence";
import type { Ticket } from "@/lib/models";
import { TicketSchema } from "@/lib/models";
import { firestoreListAllTickets } from "@/lib/firebase/tickets.firestore";
import { getStore } from "./store.server";

const adminTicketsStore = createAdminDocumentStore(FIRESTORE_TICKETS_COLLECTION, TicketSchema);

export async function loadAllTickets(): Promise<Ticket[]> {
  requireProductionPersistence();
  if (!shouldUseInMemoryStore()) {
    if (isFirebaseAdminConfigured()) {
      return adminTicketsStore.listAll();
    }
    return firestoreListAllTickets();
  }
  return Array.from(getStore().tickets.values());
}
