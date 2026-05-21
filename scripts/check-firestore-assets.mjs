import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[match[1]]) process.env[match[1]] = value;
  }
}

loadEnvFile(resolve(root, ".env"));

const { isFirebaseAdminConfigured, getFirebaseAdminDb } = await import("../src/lib/firebase/admin.ts");
const { buildSeedAssets } = await import("../src/utils/seed.assets.ts");

console.log("adminConfigured", isFirebaseAdminConfigured());
if (!isFirebaseAdminConfigured()) {
  process.exit(1);
}

const db = getFirebaseAdminDb();
const snap = await db.collection("assets").get();
const seedIds = new Set(buildSeedAssets().map((a) => a.id));
let match = 0;
const sample = [];
snap.forEach((d) => {
  if (seedIds.has(d.id)) match += 1;
  if (sample.length < 5) sample.push(d.id);
});
console.log("firestoreAssetCount", snap.size);
console.log("matchingSeedIds", match, "of", seedIds.size);
console.log("sampleIds", sample.join(", "));
