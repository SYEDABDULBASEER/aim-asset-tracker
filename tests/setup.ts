import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";

const FIREBASE_ENV_KEYS = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_APP_ID",
] as const;

/** Demo / in-memory profile: no Firebase web config. */
export function clearFirebaseEnv() {
  for (const key of FIREBASE_ENV_KEYS) {
    vi.stubEnv(key, "");
    delete process.env[key];
  }
}

afterEach(() => {
  vi.unstubAllEnvs();
  clearFirebaseEnv();
  delete (globalThis as { __assetDeskStore?: unknown }).__assetDeskStore;
  delete (globalThis as Record<symbol, unknown>)[Symbol.for("assetdesk.requestContextFallback")];
});

clearFirebaseEnv();
