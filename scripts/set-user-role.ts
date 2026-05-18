import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { APP_ROLES, type AppRole } from "../src/lib/auth/roles.ts";

const root = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");

function loadEnvFile(path: string) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;
    const key = match[1]!;
    let value = match[2]!.trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

function readServiceAccount(): Record<string, unknown> {
  const pathRaw = process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim();
  if (pathRaw) {
    return JSON.parse(readFileSync(resolve(root, pathRaw), "utf8")) as Record<string, unknown>;
  }
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw) {
    throw new Error(
      "Set FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_SERVICE_ACCOUNT_JSON in .env before assigning roles.",
    );
  }
  return JSON.parse(raw) as Record<string, unknown>;
}

function getAdminAuth() {
  const serviceAccount = readServiceAccount();
  const projectId =
    process.env.VITE_FIREBASE_PROJECT_ID?.trim() ||
    (typeof serviceAccount.project_id === "string" ? serviceAccount.project_id : "");
  if (!projectId) {
    throw new Error("Missing Firebase project id. Set VITE_FIREBASE_PROJECT_ID in .env.");
  }
  const app =
    getApps()[0] ??
    initializeApp({
      credential: cert(serviceAccount as Parameters<typeof cert>[0]),
      projectId,
    });
  return getAuth(app);
}

loadEnvFile(resolve(root, ".env"));

const email = process.argv[2]?.trim().toLowerCase();
const roleArg = process.argv[3]?.trim().toLowerCase() as AppRole | undefined;

if (!email || !roleArg || !APP_ROLES.includes(roleArg)) {
  console.error("Usage: npm run auth:set-role -- <email> <admin|agent|viewer|user>");
  process.exitCode = 1;
} else {
  try {
    const auth = getAdminAuth();
    const user = await auth.getUserByEmail(email);
    await auth.setCustomUserClaims(user.uid, { role: roleArg });
    console.log(`Assigned role "${roleArg}" to ${email}. Ask the user to sign out and sign in again.`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to assign role.";
    console.error(message);
    process.exitCode = 1;
  }
}
