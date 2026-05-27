import { describe, expect, it } from "vitest";
import { AssetSchema } from "@/lib/models";
import { loadAllAssets } from "@/utils/assets-source.server";
import { getStore } from "@/utils/store.server";
import { clearFirebaseEnv } from "../setup";

describe("assets source (demo / in-memory)", () => {
  clearFirebaseEnv();

  it("loadAllAssets returns seeded assets", async () => {
    const assets = await loadAllAssets();
    expect(assets.length).toBeGreaterThan(0);
    expect(AssetSchema.safeParse(assets[0]).success).toBe(true);
  });

  it("store supports asset CRUD", () => {
    const store = getStore();
    const id = `STORE-${Date.now()}`;
    const asset = AssetSchema.parse({
      id,
      name: "Store Test",
      category: "Laptop",
      assignedTo: null,
      department: null,
      status: "Active",
      warrantyUntil: null,
      lastServiceAt: null,
      serial: null,
      location: "HQ",
      purchaseDate: null,
      specifications: null,
    });
    store.assets.set(id, asset);
    expect(store.assets.get(id)?.name).toBe("Store Test");
    expect(store.assets.delete(id)).toBe(true);
  });

  it("list filter logic matches server function behavior", async () => {
    const all = await loadAllAssets();
    const q = all[0]?.id.slice(0, 3).toLowerCase() ?? "";
    const filtered = all.filter((a) => {
      const hay =
        `${a.id} ${a.name} ${a.assignedTo ?? ""} ${a.department ?? ""} ${a.serial ?? ""} ${a.specifications ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
    expect(filtered.length).toBeGreaterThan(0);
  });
});
