import type { Employee } from "@/lib/models";
import { EmployeeSchema } from "@/lib/models";
import { FIRESTORE_EMPLOYEES_COLLECTION } from "./env";
import { createFirestoreDocumentStore } from "./document-store";

const store = createFirestoreDocumentStore(FIRESTORE_EMPLOYEES_COLLECTION, EmployeeSchema);

export const firestoreListAllEmployees = store.listAll;
export const firestoreGetEmployeeById = store.getById;
export const firestoreUpsertEmployee = store.upsert;
export const firestoreDeleteEmployee = store.remove;
export const firestoreSeedEmployees = store.seed;

/** Replace Firestore employees with the roster list (removes legacy demo rows). */
export async function firestoreSyncEmployeesExact(
  employees: Employee[],
): Promise<{ written: number; removed: number }> {
  const rosterIds = new Set(employees.map((e) => e.id));
  const existing = await firestoreListAllEmployees();
  let removed = 0;
  for (const item of existing) {
    if (rosterIds.has(item.id)) continue;
    await firestoreDeleteEmployee(item.id);
    removed += 1;
  }
  const { written } = await firestoreSeedEmployees(employees);
  return { written, removed };
}
