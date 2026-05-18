import type { AppRole } from "./roles";
import { isEndUserRole, isStaffRole } from "./roles";

/** App entry — choose IT staff or employee sign-in. */
export const LANDING_PATH = "/";

/** IT staff sign-in (admin, agent, viewer → full workspace). */
export const STAFF_LOGIN_PATH = "/login";
export const STAFF_SIGNUP_PATH = "/signup";

/** Employee sign-in (user role → tickets only). */
export const USER_LOGIN_PATH = "/user/login";
export const USER_SIGNUP_PATH = "/user/signup";

export const ADMIN_HOME_PATH = "/admin";
export const ADMIN_ASSETS_PATH = "/admin/assets";
export const ADMIN_ALLOCATION_PATH = "/admin/allocation";
export const ADMIN_MAINTENANCE_PATH = "/admin/maintenance";
export const ADMIN_TICKETS_PATH = "/admin/tickets";
export const ADMIN_EMPLOYEES_PATH = "/admin/employees";
export const ADMIN_VENDORS_PATH = "/admin/vendors";
export const ADMIN_REPORTS_PATH = "/admin/reports";
export const ADMIN_SETTINGS_PATH = "/admin/settings";

export const USER_HOME_PATH = "/user";
export const USER_REQUEST_SUPPORT_PATH = "/user/request-support";

export const STAFF_AUTH_PATHS = new Set([STAFF_LOGIN_PATH, STAFF_SIGNUP_PATH]);
export const USER_AUTH_PATHS = new Set([USER_LOGIN_PATH, USER_SIGNUP_PATH]);

/** Pages without a workspace shell (login, signup, landing). */
export const PUBLIC_FULL_PAGE_PATHS = new Set([
  LANDING_PATH,
  STAFF_LOGIN_PATH,
  STAFF_SIGNUP_PATH,
  USER_LOGIN_PATH,
  USER_SIGNUP_PATH,
]);

export function isLandingPath(pathname: string): boolean {
  return pathname === LANDING_PATH;
}

export function isPublicFullPagePath(pathname: string): boolean {
  return PUBLIC_FULL_PAGE_PATHS.has(pathname);
}

export function isStaffAuthPath(pathname: string): boolean {
  return STAFF_AUTH_PATHS.has(pathname);
}

export function isUserAuthPath(pathname: string): boolean {
  return USER_AUTH_PATHS.has(pathname);
}

export function isUserPortalPath(pathname: string): boolean {
  if (isUserAuthPath(pathname)) return false;
  if (pathname === USER_HOME_PATH) return true;
  return pathname.startsWith(`${USER_HOME_PATH}/`);
}

export function isStaffWorkspacePath(pathname: string): boolean {
  if (isLandingPath(pathname)) return false;
  if (isPublicFullPagePath(pathname)) return false;
  if (isUserPortalPath(pathname)) return false;
  if (pathname === ADMIN_HOME_PATH) return true;
  return pathname.startsWith(`${ADMIN_HOME_PATH}/`);
}

export function defaultPathForRole(role: AppRole): string {
  if (isEndUserRole(role)) return USER_HOME_PATH;
  if (isStaffRole(role)) return ADMIN_HOME_PATH;
  return LANDING_PATH;
}

export function loginPathForRole(role: AppRole): string {
  if (isEndUserRole(role)) return USER_LOGIN_PATH;
  if (isStaffRole(role)) return STAFF_LOGIN_PATH;
  return LANDING_PATH;
}

export function roleAllowedOnStaffLogin(role: AppRole): boolean {
  return isStaffRole(role);
}

export function roleAllowedOnUserLogin(role: AppRole): boolean {
  return isEndUserRole(role);
}
