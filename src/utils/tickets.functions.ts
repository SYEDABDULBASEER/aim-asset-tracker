import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { appendAuditLog } from "@/lib/audit/write-audit";
import { AuthError, requireAuth, requireRead, requireWrite } from "@/lib/auth/require-auth";
import { isPortalGuestAuth } from "@/lib/auth/employee-portal";
import { isEmployeeWorkEmailAllowed } from "@/lib/auth/work-email-domains";
import { isEndUserRole, isStaffRole } from "@/lib/auth/roles";
import { getServerAuth } from "@/lib/auth/request-context";
import {
  ticketBelongsToRequester,
  toUserTicketSummary,
  type UserTicketSummary,
} from "@/lib/tickets/user-portal";
import { createAdminDocumentStore } from "@/lib/firebase/admin-document-store";
import { isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { FIRESTORE_TICKETS_COLLECTION, firebaseAuthRequired } from "@/lib/firebase/env";
import { shouldUseInMemoryStore } from "@/lib/firebase/production-persistence";
import {
  firestoreDeleteTicket,
  firestoreGetTicketById,
  firestoreUpsertTicket,
} from "@/lib/firebase/tickets.firestore";
import {
  TicketCommentInputSchema,
  TicketCreateInputSchema,
  TicketListQuerySchema,
  TicketSchema,
  PortalTicketDetailQuerySchema,
  PortalTicketListQuerySchema,
  TicketStatusUpdateSchema,
  TicketUpdateSchema,
  TicketUserPortalCreateSchema,
  type Ticket,
  type TicketPriority,
  type TicketStatus,
  type TicketUpdateInput,
} from "@/lib/models";
import { loadAllAssets } from "./assets-source.server";
import { loadAllTickets } from "./tickets-source.server";
import { getStore } from "./store.server";

const PRIORITY_SLA_HOURS: Record<TicketPriority, number> = {
  Critical: 4,
  High: 24,
  Medium: 72,
  Low: 120,
};

function computeSlaDueAt(isoNow: string, priority: TicketPriority): string {
  const base = new Date(isoNow);
  const h = PRIORITY_SLA_HOURS[priority];
  base.setTime(base.getTime() + h * 60 * 60 * 1000);
  return base.toISOString();
}

function newTicketId(): string {
  const part = crypto.randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase();
  return `TKT-${part}`;
}

const adminTicketsStore = createAdminDocumentStore(FIRESTORE_TICKETS_COLLECTION, TicketSchema);

async function persistTicket(ticket: Ticket): Promise<Ticket> {
  const normalized = TicketSchema.parse(ticket);
  if (!shouldUseInMemoryStore()) {
    if (isFirebaseAdminConfigured()) {
      const saved = await adminTicketsStore.upsert(normalized);
      return TicketSchema.parse(saved);
    }
    const saved = await firestoreUpsertTicket(normalized);
    return TicketSchema.parse(saved);
  }
  getStore().tickets.set(normalized.id, normalized);
  return normalized;
}

async function loadTicketById(id: string): Promise<Ticket | null> {
  if (!shouldUseInMemoryStore()) return firestoreGetTicketById(id);
  return getStore().tickets.get(id) ?? null;
}

/** Status-only update — allowed even when the ticket is closed (reopen / resolve / close). */
async function setTicketStatus(id: string, status: TicketStatus): Promise<Ticket | null> {
  const now = new Date().toISOString();
  const prev = await loadTicketById(id);
  if (!prev) return null;

  const next = TicketSchema.parse({
    ...prev,
    status,
    updatedAt: now,
    id: prev.id,
    messages: prev.messages,
  });

  return persistTicket(next);
}

async function mergeTicket(
  id: string,
  patch: Omit<TicketUpdateInput, "id">,
): Promise<Ticket | null> {
  const now = new Date().toISOString();

  const prev = await loadTicketById(id);
  if (!prev) return null;

  if (prev.status === "Closed") {
    throw new Error("Closed tickets cannot be modified.");
  }

  if (patch.assetId !== undefined && patch.assetId !== null) {
    const assets = await loadAllAssets();
    if (!assets.some((a) => a.id === patch.assetId)) {
      throw new Error(`Unknown asset id: ${patch.assetId}`);
    }
  }

  let slaDueAt = prev.slaDueAt;
  if (patch.priority !== undefined) {
    slaDueAt = computeSlaDueAt(prev.createdAt, patch.priority);
  }

  const next = TicketSchema.parse({
    ...prev,
    ...patch,
    slaDueAt,
    updatedAt: now,
    id: prev.id,
    messages: prev.messages,
  });

  if (!shouldUseInMemoryStore()) {
    return firestoreUpsertTicket(next);
  }
  getStore().tickets.set(next.id, next);
  return next;
}

export const listTickets = createServerFn({ method: "GET" })
  .inputValidator(TicketListQuerySchema.optional())
  .handler(async ({ data }) => {
    requireRead("tickets");
    const all = await loadAllTickets();
    const q = (data?.q ?? "").trim().toLowerCase();

    const filtered = all.filter((t) => {
      if (q) {
        const hay = `${t.id} ${t.title} ${t.assetId ?? ""} ${t.assigneeName ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (data?.status && t.status !== data.status) return false;
      if (data?.priority && t.priority !== data.priority) return false;
      return true;
    });

    filtered.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : a.updatedAt > b.updatedAt ? -1 : 0));

    const offset = data?.offset ?? 0;
    const limit = data?.limit ?? 100;
    const page = filtered.slice(offset, offset + limit);

    return {
      items: page.map((x) => TicketSchema.parse(x)),
      total: filtered.length,
      offset,
      limit,
    };
  });

export const getTicketById = createServerFn({ method: "GET" })
  .inputValidator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => {
    requireRead("tickets");
    if (!shouldUseInMemoryStore()) {
      return firestoreGetTicketById(data.id);
    }
    const store = getStore();
    const t = store.tickets.get(data.id);
    if (!t) return null;
    return TicketSchema.parse(t);
  });

export const createTicket = createServerFn({ method: "POST" })
  .inputValidator(TicketCreateInputSchema)
  .handler(async ({ data }) => {
    const auth = requireWrite("tickets");
    const assets = await loadAllAssets();
    const assetId = data.assetId ?? null;
    if (assetId && !assets.some((a) => a.id === assetId)) {
      throw new Error(`Unknown asset id: ${assetId}`);
    }

    const now = new Date().toISOString();
    const id = newTicketId();
    const messages =
      data.description && data.description.trim()
        ? [
            {
              id: crypto.randomUUID(),
              author: data.requesterName,
              body: data.description.trim(),
              createdAt: now,
            },
          ]
        : [];

    const ticket = TicketSchema.parse({
      id,
      title: data.title,
      assetId,
      priority: data.priority,
      status: "Open" as const,
      assigneeName: data.assigneeName?.trim() || null,
      requesterName: data.requesterName,
      openedVia: "staff",
      createdAt: now,
      updatedAt: now,
      slaDueAt: computeSlaDueAt(now, data.priority),
      messages,
    });

    const saved = await persistTicket(ticket);
    await appendAuditLog({
      actorUid: auth.uid,
      actorEmail: auth.email,
      action: "ticket.create",
      entityType: "ticket",
      entityId: saved.id,
    });
    return saved;
  });

function resolveEmployeePortalListQuery(data: {
  requesterEmail: string;
  requesterName?: string | null;
}): { requesterEmail: string; requesterName: string | null } {
  if (!firebaseAuthRequired()) {
    return {
      requesterEmail: data.requesterEmail.trim().toLowerCase(),
      requesterName: data.requesterName?.trim() || null,
    };
  }

  const auth = getServerAuth();
  if (!auth) throw new AuthError("Session required.", 401);

  if (isPortalGuestAuth(auth)) {
    const email = data.requesterEmail.trim().toLowerCase();
    if (!email) throw new AuthError("Work email is required.", 400);
    if (!isEmployeeWorkEmailAllowed(email)) {
      throw new AuthError(
        "This email is not allowed for the employee portal. Use your organization work email.",
        403,
      );
    }
    return { requesterEmail: email, requesterName: data.requesterName?.trim() || null };
  }

  if (isStaffRole(auth.role)) {
    // Allow IT staff to view tickets they raise via the employee portal header
    // (demo convenience). Access is still scoped by the portal form identity below.
    const email = data.requesterEmail.trim().toLowerCase();
    if (!email) throw new AuthError("Work email is required.", 400);
    if (!isEmployeeWorkEmailAllowed(email)) {
      throw new AuthError("Use your organization work email for this portal.", 403);
    }
    return { requesterEmail: email, requesterName: data.requesterName?.trim() || null };
  }

  if (isEndUserRole(auth.role) && auth.email?.trim()) {
    const email = auth.email.trim().toLowerCase();
    if (email !== data.requesterEmail.trim().toLowerCase()) {
      throw new AuthError("Email does not match your account.", 403);
    }
    return { requesterEmail: email, requesterName: data.requesterName?.trim() || null };
  }

  throw new AuthError("Unauthorized.", 403);
}

/** Tickets raised by an employee (matched by work email / name). */
export const listMyUserTickets = createServerFn({ method: "GET" })
  .inputValidator(PortalTicketListQuerySchema)
  .handler(async ({ data }) => {
    const { requesterEmail, requesterName } = resolveEmployeePortalListQuery(data);

    try {
      const all = await loadAllTickets();
      const items: UserTicketSummary[] = all
        .filter((t) => ticketBelongsToRequester(t, requesterEmail, requesterName))
        .map((t) => toUserTicketSummary(TicketSchema.parse(t)))
        .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : a.updatedAt > b.updatedAt ? -1 : 0));
      return { items };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load tickets.";
      if (message.includes("Firebase Admin is not configured")) {
        throw new AuthError(
          "Server cannot read tickets. Add FIREBASE_SERVICE_ACCOUNT_PATH to your .env file.",
          503,
        );
      }
      throw error instanceof Error ? error : new Error(message);
    }
  });

export const getMyUserTicket = createServerFn({ method: "GET" })
  .inputValidator(PortalTicketDetailQuerySchema)
  .handler(async ({ data }) => {
    const { requesterEmail, requesterName } = resolveEmployeePortalListQuery(data);

    let ticket: Ticket | null = null;
    if (!shouldUseInMemoryStore()) {
      ticket = await firestoreGetTicketById(data.id);
    } else {
      const raw = getStore().tickets.get(data.id);
      ticket = raw ? TicketSchema.parse(raw) : null;
    }
    if (!ticket || !ticketBelongsToRequester(ticket, requesterEmail, requesterName)) {
      throw new AuthError("Ticket not found.", 404);
    }
    return TicketSchema.parse(ticket);
  });

/** Employee self-service ticket. Uses Admin SDK when configured so Firestore rules do not block writes. */
export const createUserTicket = createServerFn({ method: "POST" })
  .inputValidator(TicketUserPortalCreateSchema)
  .handler(async ({ data }) => {
    const assets = await loadAllAssets();
    const assetId = data.assetId?.trim() ? data.assetId.trim() : null;
    if (assetId && !assets.some((a) => a.id === assetId)) {
      throw new Error(`Unknown asset id: ${assetId}`);
    }

    const now = new Date().toISOString();
    const id = newTicketId();

    const messages = [
      {
        id: crypto.randomUUID(),
        author: data.requesterName.trim(),
        body: data.description.trim(),
        createdAt: now,
      },
    ];

    if (firebaseAuthRequired()) {
      const auth = getServerAuth();
      if (!auth) throw new AuthError("Session required.", 401);

      let email: string;

      if (isPortalGuestAuth(auth)) {
        email = data.requesterEmail?.trim().toLowerCase() ?? "";
        if (!email) throw new Error("Work email is required so IT can contact you.");
        if (!isEmployeeWorkEmailAllowed(email)) {
          throw new Error("Use your organization work email for this portal.");
        }
      } else if (isStaffRole(auth.role)) {
        // Allow IT staff to submit via the employee portal header as well (e.g. during demos).
        // The portal identity still comes from the form fields so tickets remain scoped.
        email = data.requesterEmail?.trim().toLowerCase() ?? "";
        if (!email) throw new Error("Work email is required so IT can contact you.");
        if (!isEmployeeWorkEmailAllowed(email)) {
          throw new Error("Use your organization work email for this portal.");
        }
      } else if (isEndUserRole(auth.role) && auth.email?.trim()) {
        email = auth.email.trim().toLowerCase();
      } else {
        throw new AuthError("Unauthorized.", 403);
      }

      const ticket = TicketSchema.parse({
        id,
        title: data.title.trim(),
        assetId,
        priority: data.priority,
        status: "Open" as const,
        assigneeName: null,
        requesterName: data.requesterName.trim(),
        requesterEmail: email,
        deskNumber: data.deskNumber.trim(),
        openedVia: "user_portal",
        createdAt: now,
        updatedAt: now,
        slaDueAt: computeSlaDueAt(now, data.priority),
        messages,
      });
      const saved = await persistTicket(ticket);
      await appendAuditLog({
        actorUid: auth.uid,
        actorEmail: email,
        action: "ticket.create.user_portal",
        entityType: "ticket",
        entityId: saved.id,
        metadata: {
          requesterName: data.requesterName.trim(),
          deskNumber: data.deskNumber.trim(),
        },
      });
      return saved;
    }

    const portalAuth = getServerAuth();
    const email =
      data.requesterEmail?.trim() ||
      (portalAuth?.email && isEndUserRole(portalAuth.role) ? portalAuth.email : null) ||
      null;
    const ticket = TicketSchema.parse({
      id,
      title: data.title.trim(),
      assetId,
      priority: data.priority,
      status: "Open" as const,
      assigneeName: null,
      requesterName: data.requesterName.trim(),
      requesterEmail: email,
      deskNumber: data.deskNumber.trim(),
      openedVia: "user_portal",
      createdAt: now,
      updatedAt: now,
      slaDueAt: computeSlaDueAt(now, data.priority),
      messages,
    });

    const saved = await persistTicket(ticket);
    await appendAuditLog({
      actorUid: "user-portal",
      actorEmail: email,
      action: "ticket.create.user_portal",
      entityType: "ticket",
      entityId: saved.id,
      metadata: {
        requesterName: data.requesterName.trim(),
        deskNumber: data.deskNumber.trim(),
      },
    });
    return saved;
  });

export const updateTicket = createServerFn({ method: "POST" })
  .inputValidator(TicketUpdateSchema)
  .handler(async ({ data }) => {
    const auth = requireWrite("tickets");
    const { id, ...patch } = data;
    const saved = await mergeTicket(id, patch);
    if (saved) {
      await appendAuditLog({
        actorUid: auth.uid,
        actorEmail: auth.email,
        action: "ticket.update",
        entityType: "ticket",
        entityId: saved.id,
      });
    }
    return saved;
  });

export const updateTicketStatus = createServerFn({ method: "POST" })
  .inputValidator(TicketStatusUpdateSchema)
  .handler(async ({ data }) => {
    const auth = requireWrite("tickets");
    const saved = await setTicketStatus(data.id, data.status);
    if (saved) {
      await appendAuditLog({
        actorUid: auth.uid,
        actorEmail: auth.email,
        action: "ticket.status",
        entityType: "ticket",
        entityId: saved.id,
        metadata: { status: data.status },
      });
    }
    return saved;
  });

export const addTicketComment = createServerFn({ method: "POST" })
  .inputValidator(TicketCommentInputSchema)
  .handler(async ({ data }) => {
    const auth = requireWrite("tickets");
    const now = new Date().toISOString();
    const message = {
      id: crypto.randomUUID(),
      author: data.author.trim(),
      body: data.body.trim(),
      createdAt: now,
    };

    if (!shouldUseInMemoryStore()) {
      const prev = await firestoreGetTicketById(data.id);
      if (!prev) return null;
      if (prev.status === "Closed") {
        throw new Error("Cannot add comments to a closed ticket.");
      }
      const next = TicketSchema.parse({
        ...prev,
        messages: [...prev.messages, message],
        updatedAt: now,
      });
      const saved = await firestoreUpsertTicket(next);
      await appendAuditLog({
        actorUid: auth.uid,
        actorEmail: auth.email,
        action: "ticket.comment",
        entityType: "ticket",
        entityId: saved.id,
      });
      return saved;
    }

    const store = getStore();
    const prev = store.tickets.get(data.id);
    if (!prev) return null;
    if (prev.status === "Closed") {
      throw new Error("Cannot add comments to a closed ticket.");
    }
    const next = TicketSchema.parse({
      ...prev,
      messages: [...prev.messages, message],
      updatedAt: now,
    });
    store.tickets.set(next.id, next);
    await appendAuditLog({
      actorUid: auth.uid,
      actorEmail: auth.email,
      action: "ticket.comment",
      entityType: "ticket",
      entityId: next.id,
    });
    return next;
  });

export const deleteTicket = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => {
    const auth = requireWrite("tickets");
    if (!shouldUseInMemoryStore()) {
      const existed = await firestoreGetTicketById(data.id);
      if (existed) await firestoreDeleteTicket(data.id);
      if (existed) {
        await appendAuditLog({
          actorUid: auth.uid,
          actorEmail: auth.email,
          action: "ticket.delete",
          entityType: "ticket",
          entityId: data.id,
        });
      }
      return { ok: Boolean(existed) };
    }
    const store = getStore();
    const existed = store.tickets.delete(data.id);
    if (existed) {
      await appendAuditLog({
        actorUid: auth.uid,
        actorEmail: auth.email,
        action: "ticket.delete",
        entityType: "ticket",
        entityId: data.id,
      });
    }
    return { ok: existed };
  });
