import { existsSync, readFileSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";
import { initializeApp, cert, getApps, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getFirebaseWebConfig } from "./env";
import { loadServerEnvFile } from "./load-server-env";

loadServerEnvFile();

let adminApp: App | undefined;
let adminDb: Firestore | undefined;

function readServiceAccountJson(): Record<string, unknown> | null {
  const pathRaw =
    (typeof process !== "undefined" ? process.env.FIREBASE_SERVICE_ACCOUNT_PATH : undefined) ??
    import.meta.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (pathRaw && typeof pathRaw === "string" && pathRaw.trim()) {
    try {
      const trimmed = pathRaw.trim();
      const filePath = isAbsolute(trimmed) ? trimmed : resolve(process.cwd(), trimmed);
      if (!existsSync(filePath)) return null;
      return JSON.parse(readFileSync(filePath, "utf8")) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  const raw =
    (typeof process !== "undefined" ? process.env.FIREBASE_SERVICE_ACCOUNT_JSON : undefined) ??
    import.meta.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw || typeof raw !== "string" || !raw.trim()) return null;
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function isFirebaseAdminConfigured(): boolean {
  return Boolean(readServiceAccountJson() && getFirebaseWebConfig());
}

export function getFirebaseAdminApp(): App {
  if (adminApp) return adminApp;
  const serviceAccount = readServiceAccountJson();
  const config = getFirebaseWebConfig();
  if (!serviceAccount || !config) {
    throw new Error("Firebase Admin is not configured.");
  }
  adminApp =
    getApps()[0] ??
    initializeApp({
      credential: cert(serviceAccount as Parameters<typeof cert>[0]),
      projectId: config.projectId,
    });
  return adminApp;
}

export function getFirebaseAdminDb(): Firestore {
  if (adminDb) return adminDb;
  adminDb = getFirestore(getFirebaseAdminApp());
  return adminDb;
}
