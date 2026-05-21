import { isFirebaseConfigured } from "@/lib/firebase/env";

export function requireProductionPersistence(): void {
  if (import.meta.env?.PROD && !isFirebaseConfigured()) {
    throw new Error("Firebase must be configured in production.");
  }
}

export function shouldUseInMemoryStore(): boolean {
  return !isFirebaseConfigured();
}
