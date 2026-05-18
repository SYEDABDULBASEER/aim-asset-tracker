/** Firestore collection name for hardware assets. */
export const FIRESTORE_ASSETS_COLLECTION = "assets";

/** Firestore collection name for service desk tickets. */
export const FIRESTORE_TICKETS_COLLECTION = "tickets";

/** Firestore collection name for asset transfer records. */
export const FIRESTORE_TRANSFERS_COLLECTION = "transfers";

/** Firestore collection name for maintenance jobs. */
export const FIRESTORE_MAINTENANCE_COLLECTION = "maintenanceJobs";

/** Firestore collection name for employee directory entries. */
export const FIRESTORE_EMPLOYEES_COLLECTION = "employees";

/** Firestore collection name for vendor master records. */
export const FIRESTORE_VENDORS_COLLECTION = "vendors";

/** Firestore collection name for immutable audit log entries. */
export const FIRESTORE_AUDIT_LOGS_COLLECTION = "auditLogs";

/** Firestore collection name for organization settings. */
export const FIRESTORE_ORG_SETTINGS_COLLECTION = "orgSettings";

function env(name: keyof ImportMetaEnv): string {
  const fromImport =
    typeof import.meta !== "undefined" && import.meta.env ? import.meta.env[name] : undefined;
  if (typeof fromImport === "string" && fromImport.trim()) {
    return fromImport.trim();
  }
  const fromProcess = typeof process !== "undefined" ? process.env[name] : undefined;
  return typeof fromProcess === "string" ? fromProcess.trim() : "";
}

/** True when all required public Firebase web config values are set. */
export function isFirebaseConfigured(): boolean {
  return Boolean(
    env("VITE_FIREBASE_API_KEY") &&
    env("VITE_FIREBASE_AUTH_DOMAIN") &&
    env("VITE_FIREBASE_PROJECT_ID") &&
    env("VITE_FIREBASE_STORAGE_BUCKET") &&
    env("VITE_FIREBASE_MESSAGING_SENDER_ID") &&
    env("VITE_FIREBASE_APP_ID"),
  );
}

export function getFirebaseWebConfig() {
  if (!isFirebaseConfigured()) return null;
  return {
    apiKey: env("VITE_FIREBASE_API_KEY"),
    authDomain: env("VITE_FIREBASE_AUTH_DOMAIN"),
    projectId: env("VITE_FIREBASE_PROJECT_ID"),
    storageBucket: env("VITE_FIREBASE_STORAGE_BUCKET"),
    messagingSenderId: env("VITE_FIREBASE_MESSAGING_SENDER_ID"),
    appId: env("VITE_FIREBASE_APP_ID"),
  } as const;
}

function isTruthyEnvFlag(value: string | undefined): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

/** True during `vite dev` / non-production Node (used for messaging only). */
export function isLocalDevelopment(): boolean {
  if (typeof import.meta !== "undefined" && import.meta.env) {
    return !import.meta.env.PROD;
  }
  return typeof process !== "undefined" && process.env.NODE_ENV !== "production";
}

/**
 * Skip login and use demo server context. Set `VITE_ALLOW_DEMO_AUTH=true` in `.env` to opt in
 * while Firebase is configured (e.g. quick UI work without tokens).
 */
export function allowDemoAuthInDevelopment(): boolean {
  if (typeof import.meta !== "undefined" && import.meta.env?.PROD) return false;
  if (typeof process !== "undefined" && process.env.NODE_ENV === "production") return false;
  return isTruthyEnvFlag(env("VITE_ALLOW_DEMO_AUTH"));
}

/** Sign-in gate + Bearer tokens required on server functions. */
export function firebaseAuthRequired(): boolean {
  return isFirebaseConfigured() && !allowDemoAuthInDevelopment();
}
