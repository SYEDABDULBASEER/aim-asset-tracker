export const APP_ROLES = ["admin", "agent", "viewer", "user"] as const;
export type AppRole = (typeof APP_ROLES)[number];

/** IT / operations workspace (dashboard, assets, ticket queue). */
export const STAFF_ROLES = ["admin", "agent", "viewer"] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

/** Self-service portal (report issues). */
export const END_USER_ROLES = ["user"] as const;
export type EndUserRole = (typeof END_USER_ROLES)[number];

export const PERMISSION_DOMAINS = [
  "assets",
  "tickets",
  "transfers",
  "maintenance",
  "employees",
  "vendors",
  "settings",
  "audit",
  "seed",
  "reports",
] as const;
export type PermissionDomain = (typeof PERMISSION_DOMAINS)[number];

const WRITE_MATRIX: Record<AppRole, readonly PermissionDomain[]> = {
  admin: PERMISSION_DOMAINS,
  agent: ["assets", "tickets", "transfers", "maintenance", "reports"],
  viewer: [],
  user: [],
};

const READ_MATRIX: Record<AppRole, readonly PermissionDomain[]> = {
  admin: PERMISSION_DOMAINS,
  agent: ["assets", "tickets", "transfers", "maintenance", "employees", "vendors", "reports"],
  viewer: ["assets", "tickets", "transfers", "maintenance", "employees", "vendors", "reports"],
  user: [],
};

export function normalizeAppRole(value: unknown): AppRole {
  if (value === "admin" || value === "agent" || value === "viewer" || value === "user")
    return value;
  return "viewer";
}

export function isStaffRole(role: AppRole): role is StaffRole {
  return role === "admin" || role === "agent" || role === "viewer";
}

export function isEndUserRole(role: AppRole): role is EndUserRole {
  return role === "user";
}

export function formatAppRoleLabel(role: AppRole): string {
  if (role === "admin") return "Admin";
  if (role === "agent") return "Agent";
  if (role === "viewer") return "Viewer";
  return "User";
}

export function canRead(role: AppRole, domain: PermissionDomain): boolean {
  return READ_MATRIX[role].includes(domain);
}

export function canWrite(role: AppRole, domain: PermissionDomain): boolean {
  return WRITE_MATRIX[role].includes(domain);
}
