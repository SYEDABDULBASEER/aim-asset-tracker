export type DevPersona = "staff" | "user";

const STORAGE_KEY = "assetdesk.devPersona";

export function getDevPersona(): DevPersona | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (raw === "staff" || raw === "user") return raw;
  return null;
}

export function setDevPersona(persona: DevPersona): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, persona);
}

export function clearDevPersona(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
}
