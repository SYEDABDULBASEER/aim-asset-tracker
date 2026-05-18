import type { z } from "zod";
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

const BATCH_SIZE = 400;

function toFirestoreFields<T extends { id: string }>(value: T): Record<string, unknown> {
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}

export function createFirestoreDocumentStore<T extends { id: string }>(
  collectionName: string,
  schema: z.ZodType<T>,
) {
  async function listAll(): Promise<T[]> {
    const db = getFirestoreDb();
    const snap = await getDocs(collection(db, collectionName));
    const out: T[] = [];
    snap.forEach((d) => {
      const parsed = schema.safeParse({ id: d.id, ...d.data() });
      if (parsed.success) out.push(parsed.data);
    });
    return out;
  }

  async function getById(id: string): Promise<T | null> {
    const db = getFirestoreDb();
    const ref = doc(db, collectionName, id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    const parsed = schema.safeParse({ id: snap.id, ...snap.data() });
    return parsed.success ? parsed.data : null;
  }

  async function upsert(value: T): Promise<T> {
    const db = getFirestoreDb();
    const validated = schema.parse(value);
    await setDoc(doc(db, collectionName, validated.id), toFirestoreFields(validated));
    return validated;
  }

  async function remove(id: string): Promise<boolean> {
    const db = getFirestoreDb();
    await deleteDoc(doc(db, collectionName, id));
    return true;
  }

  async function seed(values: T[]): Promise<{ written: number }> {
    const db = getFirestoreDb();
    let written = 0;
    for (let i = 0; i < values.length; i += BATCH_SIZE) {
      const batch = writeBatch(db);
      const chunk = values.slice(i, i + BATCH_SIZE);
      for (const value of chunk) {
        const validated = schema.parse(value);
        batch.set(doc(db, collectionName, validated.id), toFirestoreFields(validated));
        written += 1;
      }
      await batch.commit();
    }
    return { written };
  }

  return { listAll, getById, upsert, remove, seed };
}
