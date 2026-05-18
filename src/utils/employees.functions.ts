import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { appendAuditLog } from "@/lib/audit/write-audit";
import { requireRead, requireWrite } from "@/lib/auth/require-auth";
import { shouldUseInMemoryStore } from "@/lib/firebase/production-persistence";
import {
  firestoreDeleteEmployee,
  firestoreGetEmployeeById,
  firestoreUpsertEmployee,
} from "@/lib/firebase/employees.firestore";
import {
  EmployeeCreateSchema,
  EmployeeListQuerySchema,
  EmployeeSchema,
  EmployeeUpdateSchema,
} from "@/lib/models";
import { loadAllEmployees } from "./employees-source.server";
import { getStore } from "./store.server";

export const listEmployees = createServerFn({ method: "GET" })
  .inputValidator(EmployeeListQuerySchema.optional())
  .handler(async ({ data }) => {
    requireRead("employees");
    const all = await loadAllEmployees();
    const q = (data?.q ?? "").trim().toLowerCase();

    const filtered = all.filter((e) => {
      if (q) {
        const hay = `${e.id} ${e.name} ${e.role} ${e.department} ${e.email}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (data?.department && e.department !== data.department) return false;
      return true;
    });

    filtered.sort((a, b) => a.name.localeCompare(b.name));

    const offset = data?.offset ?? 0;
    const limit = data?.limit ?? 200;
    const page = filtered.slice(offset, offset + limit);

    return {
      items: page.map((x) => EmployeeSchema.parse(x)),
      total: filtered.length,
      offset,
      limit,
    };
  });

export const createEmployee = createServerFn({ method: "POST" })
  .inputValidator(EmployeeCreateSchema)
  .handler(async ({ data }) => {
    const auth = requireWrite("employees");
    const employee = EmployeeSchema.parse({ ...data, assetCount: 0 });
    if (!shouldUseInMemoryStore()) {
      const existing = await firestoreGetEmployeeById(employee.id);
      if (existing) throw new Error(`Employee already exists: ${employee.id}`);
      const saved = await firestoreUpsertEmployee(employee);
      await appendAuditLog({
        actorUid: auth.uid,
        actorEmail: auth.email,
        action: "employee.create",
        entityType: "employee",
        entityId: saved.id,
      });
      return saved;
    }
    const store = getStore();
    if (store.employees.has(employee.id)) {
      throw new Error(`Employee already exists: ${employee.id}`);
    }
    store.employees.set(employee.id, employee);
    await appendAuditLog({
      actorUid: auth.uid,
      actorEmail: auth.email,
      action: "employee.create",
      entityType: "employee",
      entityId: employee.id,
    });
    return employee;
  });

export const updateEmployee = createServerFn({ method: "POST" })
  .inputValidator(EmployeeUpdateSchema)
  .handler(async ({ data }) => {
    const auth = requireWrite("employees");
    if (!shouldUseInMemoryStore()) {
      const prev = await firestoreGetEmployeeById(data.id);
      if (!prev) return null;
      const next = EmployeeSchema.parse({ ...prev, ...data });
      const saved = await firestoreUpsertEmployee(next);
      await appendAuditLog({
        actorUid: auth.uid,
        actorEmail: auth.email,
        action: "employee.update",
        entityType: "employee",
        entityId: saved.id,
      });
      return saved;
    }
    const store = getStore();
    const prev = store.employees.get(data.id);
    if (!prev) return null;
    const next = EmployeeSchema.parse({ ...prev, ...data });
    store.employees.set(next.id, next);
    await appendAuditLog({
      actorUid: auth.uid,
      actorEmail: auth.email,
      action: "employee.update",
      entityType: "employee",
      entityId: next.id,
    });
    return next;
  });

export const deleteEmployee = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => {
    const auth = requireWrite("employees");
    if (!shouldUseInMemoryStore()) {
      const existed = await firestoreGetEmployeeById(data.id);
      if (existed) await firestoreDeleteEmployee(data.id);
      if (existed) {
        await appendAuditLog({
          actorUid: auth.uid,
          actorEmail: auth.email,
          action: "employee.delete",
          entityType: "employee",
          entityId: data.id,
        });
      }
      return { ok: Boolean(existed) };
    }
    const existed = getStore().employees.delete(data.id);
    if (existed) {
      await appendAuditLog({
        actorUid: auth.uid,
        actorEmail: auth.email,
        action: "employee.delete",
        entityType: "employee",
        entityId: data.id,
      });
    }
    return { ok: existed };
  });
