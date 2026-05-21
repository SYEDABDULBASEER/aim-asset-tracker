import "./load-env.mjs";

const { isFirebaseAdminConfigured } = await import("../src/lib/firebase/admin.ts");
const { loadAllAssets } = await import("../src/utils/assets-source.server.ts");

console.log("adminConfigured", isFirebaseAdminConfigured());
const assets = await loadAllAssets();
console.log("assetCount", assets.length);
console.log("sample", assets.slice(0, 3).map((a) => a.id).join(", "));
