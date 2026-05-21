/**
 * Restrict signups to organization domains (e.g. contoso.com, subsidiary.onmicrosoft.com).
 * Empty allowlist = any email allowed (useful for local dev).
 */

function readEnv(name: string): string {
  const fromImport =
    typeof import.meta !== "undefined" && import.meta.env ? import.meta.env[name] : undefined;
  if (typeof fromImport === "string" && fromImport.trim()) return fromImport.trim();
  const fromProcess = typeof process !== "undefined" ? process.env[name] : undefined;
  return typeof fromProcess === "string" ? fromProcess.trim() : "";
}

function parseDomainList(raw: string): string[] {
  if (!raw.trim()) return [];
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase().replace(/^@/, ""))
    .filter(Boolean);
}

/** Comma-separated domains for IT staff self-signup (e.g. `contoso.com,subsidiary.onmicrosoft.com`). */
export function getStaffEmailDomainAllowlist(): string[] {
  return parseDomainList(readEnv("VITE_ALLOWED_STAFF_EMAIL_DOMAINS"));
}

/** Optional: comma-separated domains for employee portal accounts. */
export function getEmployeeEmailDomainAllowlist(): string[] {
  return parseDomainList(readEnv("VITE_ALLOWED_EMPLOYEE_EMAIL_DOMAINS"));
}

export function isEmailDomainInList(email: string, allowlist: string[]): boolean {
  if (allowlist.length === 0) return true;
  const normalized = email.trim().toLowerCase();
  const at = normalized.lastIndexOf("@");
  if (at < 0 || at === normalized.length - 1) return false;
  const domain = normalized.slice(at + 1);
  return allowlist.includes(domain);
}

export function isStaffWorkEmailAllowed(email: string): boolean {
  return isEmailDomainInList(email, getStaffEmailDomainAllowlist());
}

export function isEmployeeWorkEmailAllowed(email: string): boolean {
  return isEmailDomainInList(email, getEmployeeEmailDomainAllowlist());
}

/** Human-readable hint for the sign-in/signup UI. */
export function formatDomainHint(allowlist: string[]): string {
  if (allowlist.length === 0) return "";
  if (allowlist.length <= 2) return allowlist.map((d) => `@${d}`).join(" or ");
  return `${allowlist
    .slice(0, 2)
    .map((d) => `@${d}`)
    .join(", ")}, …`;
}
