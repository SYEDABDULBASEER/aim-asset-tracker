import type { ServerAuthContext } from "./request-context";

/** Header sent with employee-portal server calls (no Firebase user; identity from form/local session). */
export const EMPLOYEE_PORTAL_FN_HEADER = "x-assetdesk-employee-portal";
export const EMPLOYEE_PORTAL_FN_HEADER_VALUE = "1";

/** Synthetic auth when the employee portal calls server functions without a Firebase ID token. */
export const PORTAL_GUEST_UID = "portal-guest";

export const PORTAL_GUEST_SERVER_AUTH: ServerAuthContext = {
  uid: PORTAL_GUEST_UID,
  email: null,
  role: "user",
};

export function isPortalGuestAuth(auth: ServerAuthContext | null | undefined): boolean {
  return auth?.uid === PORTAL_GUEST_UID;
}
