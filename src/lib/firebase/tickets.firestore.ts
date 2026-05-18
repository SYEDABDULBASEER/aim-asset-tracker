import type { Ticket } from "@/lib/models";
import { TicketSchema } from "@/lib/models";
import { FIRESTORE_TICKETS_COLLECTION } from "./env";
import { getFirestoreDb } from "./init";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  writeBatch,
} from "firebase/firestore";

function ticketToFirestoreFields(t: Ticket): Record<string, unknown> {
  return JSON.parse(JSON.stringify(t)) as Record<string, unknown>;
}

export async function firestoreListAllTickets(): Promise<Ticket[]> {
  const db = getFirestoreDb();
  const snap = await getDocs(collection(db, FIRESTORE_TICKETS_COLLECTION));
  const out: Ticket[] = [];
  snap.forEach((d) => {
    const raw = { id: d.id, ...d.data() };
    const parsed = TicketSchema.safeParse(raw);
    if (parsed.success) out.push(parsed.data);
  });
  return out;
}

export async function firestoreGetTicketById(id: string): Promise<Ticket | null> {
  const db = getFirestoreDb();
  const ref = doc(db, FIRESTORE_TICKETS_COLLECTION, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const parsed = TicketSchema.safeParse({ id: snap.id, ...snap.data() });
  return parsed.success ? parsed.data : null;
}

export async function firestoreUpsertTicket(ticket: Ticket): Promise<Ticket> {
  const db = getFirestoreDb();
  const validated = TicketSchema.parse(ticket);
  await setDoc(
    doc(db, FIRESTORE_TICKETS_COLLECTION, validated.id),
    ticketToFirestoreFields(validated),
  );
  return validated;
}

export async function firestoreDeleteTicket(id: string): Promise<boolean> {
  const db = getFirestoreDb();
  await deleteDoc(doc(db, FIRESTORE_TICKETS_COLLECTION, id));
  return true;
}

const BATCH_SIZE = 400;

export async function firestoreSeedTickets(tickets: Ticket[]): Promise<{ written: number }> {
  const db = getFirestoreDb();
  let written = 0;
  for (let i = 0; i < tickets.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    const chunk = tickets.slice(i, i + BATCH_SIZE);
    for (const t of chunk) {
      const validated = TicketSchema.parse(t);
      batch.set(
        doc(db, FIRESTORE_TICKETS_COLLECTION, validated.id),
        ticketToFirestoreFields(validated),
      );
      written += 1;
    }
    await batch.commit();
  }
  return { written };
}
