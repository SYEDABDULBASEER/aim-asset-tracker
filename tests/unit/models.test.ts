import { describe, expect, it } from "vitest";
import { AssetCreateSchema, AssetSchema, AssetUpdateSchema, TicketSchema } from "@/lib/models";

describe("models (Zod)", () => {
  const validAsset = {
    id: "AST-1",
    name: "Laptop",
    category: "Laptop" as const,
    assignedTo: null,
    department: "operations",
    status: "Active" as const,
    warrantyUntil: null,
    lastServiceAt: null,
    serial: "SN1",
    location: "HQ",
    purchaseDate: null,
    specifications: null,
  };

  it("parses a valid asset", () => {
    const parsed = AssetSchema.parse(validAsset);
    expect(parsed.id).toBe("AST-1");
  });

  it("normalizes legacy Servers category to Desktop", () => {
    const parsed = AssetSchema.parse({ ...validAsset, category: "Servers" });
    expect(parsed.category).toBe("Desktop");
  });

  it("rejects invalid category", () => {
    expect(() => AssetSchema.parse({ ...validAsset, category: "ServersX" })).toThrow();
  });

  it("validates AssetCreateSchema", () => {
    const created = AssetCreateSchema.parse({
      id: "NEW-1",
      name: "Monitor",
      category: "Monitor",
      status: "Active",
    });
    expect(created.id).toBe("NEW-1");
  });

  it("validates AssetUpdateSchema partial", () => {
    const updated = AssetUpdateSchema.parse({ id: "AST-1", name: "Renamed" });
    expect(updated.name).toBe("Renamed");
  });

  it("parses ticket with messages", () => {
    const ticket = TicketSchema.parse({
      id: "TKT-1",
      title: "Broken",
      assetId: null,
      priority: "High",
      status: "Open",
      assigneeName: null,
      requesterEmail: "user@corp.com",
      requesterName: "User",
      openedVia: "user_portal",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      slaDueAt: new Date().toISOString(),
      messages: [],
    });
    expect(ticket.openedVia).toBe("user_portal");
  });
});
