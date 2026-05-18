import type { z } from "zod";
import { getFirebaseAdminDb } from "./admin";

const BATCH_SIZE = 400;

function toFirestoreFields<T extends { id: string }>(value: T): Record<string, unknown> {
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}

export function createAdminDocumentStore<T extends { id: string }>(
  collectionName: string,
  schema: z.ZodType<T>,
) {
  async function listAll(): Promise<T[]> {
    const db = getFirebaseAdminDb();
    const snap = await db.collection(collectionName).get();
    const out: T[] = [];
    snap.forEach((d) => {
      const parsed = schema.safeParse({ id: d.id, ...d.data() });
      if (parsed.success) out.push(parsed.data);
    });
    return out;
  }

  async function getById(id: string): Promise<T | null> {
    const db = getFirebaseAdminDb();
    const snap = await db.collection(collectionName).doc(id).get();
    if (!snap.exists) return null;
    const parsed = schema.safeParse({ id: snap.id, ...snap.data() });
    return parsed.success ? parsed.data : null;
  }

  async function upsert(value: T): Promise<T> {
    const db = getFirebaseAdminDb();
    const validated = schema.parse(value);
    await db.collection(collectionName).doc(validated.id).set(toFirestoreFields(validated));
    return validated;
  }

  async function remove(id: string): Promise<boolean> {
    const db = getFirebaseAdminDb();
    await db.collection(collectionName).doc(id).delete();
    return true;
  }

  async function seed(values: T[]): Promise<{ written: number }> {
    const db = getFirebaseAdminDb();
    let written = 0;
    for (let i = 0; i < values.length; i += BATCH_SIZE) {
      const batch = db.batch();
      for (const value of values.slice(i, i + BATCH_SIZE)) {
        const validated = schema.parse(value);
        batch.set(db.collection(collectionName).doc(validated.id), toFirestoreFields(validated));
        written += 1;
      }
      await batch.commit();
    }
    return { written };
  }

  return { listAll, getById, upsert, remove, seed };
}
