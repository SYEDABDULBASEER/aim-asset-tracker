import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Optional integration guard: documents rules gap and skips live emulator
 * unless FIRESTORE_EMULATOR_HOST is set in the environment.
 */
describe("firebase emulator integration (optional)", () => {
  it("documents that deployed firestore.rules are permissive until hardened", () => {
    const rulesPath = resolve(process.cwd(), "firestore.rules");
    const rules = readFileSync(rulesPath, "utf8");
    expect(rules).toContain("allow read, write: if true");
  });

  it.skipIf(!process.env.FIRESTORE_EMULATOR_HOST)(
    "connects to Firestore emulator when FIRESTORE_EMULATOR_HOST is set",
    async () => {
      const { isFirebaseAdminConfigured } = await import("@/lib/firebase/admin");
      expect(isFirebaseAdminConfigured()).toBe(true);
    },
  );
});
