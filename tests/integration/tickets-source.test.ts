import { describe, expect, it } from "vitest";
import { TicketSchema } from "@/lib/models";
import { loadAllTickets } from "@/utils/tickets-source.server";
import { getStore } from "@/utils/store.server";
import { clearFirebaseEnv } from "../setup";

describe("tickets source (demo / in-memory)", () => {
  clearFirebaseEnv();

  it("loadAllTickets returns seeded tickets", async () => {
    const tickets = await loadAllTickets();
    expect(tickets.length).toBeGreaterThan(0);
    expect(TicketSchema.safeParse(tickets[0]).success).toBe(true);
  });

  it("store accepts portal ticket shape", () => {
    const store = getStore();
    const now = new Date().toISOString();
    const id = `TKT-TEST-${Date.now()}`;
    const ticket = TicketSchema.parse({
      id,
      title: "Portal test ticket",
      assetId: null,
      priority: "Medium",
      status: "Open",
      assigneeName: null,
      requesterName: "Test User",
      requesterEmail: "test@example.com",
      deskNumber: "D-1",
      openedVia: "user_portal",
      createdAt: now,
      updatedAt: now,
      slaDueAt: now,
      messages: [],
    });
    store.tickets.set(id, ticket);
    expect(store.tickets.get(id)?.openedVia).toBe("user_portal");
  });
});
