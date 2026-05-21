const EMAIL_KEY = "assetdesk.portal.requesterEmail";
const NAME_KEY = "assetdesk.portal.requesterName";
const DESK_KEY = "assetdesk.portal.deskNumber";

export type PortalSession = {
  email: string;
  name: string;
  deskNumber: string;
};

export function readPortalSession(): PortalSession {
  if (typeof window === "undefined") {
    return { email: "", name: "", deskNumber: "" };
  }
  return {
    email: localStorage.getItem(EMAIL_KEY) ?? "",
    name: localStorage.getItem(NAME_KEY) ?? "",
    deskNumber: localStorage.getItem(DESK_KEY) ?? "",
  };
}

export function writePortalSession(session: PortalSession): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(EMAIL_KEY, session.email.trim());
  localStorage.setItem(NAME_KEY, session.name.trim());
  localStorage.setItem(DESK_KEY, session.deskNumber.trim());
}

export function clearPortalSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(EMAIL_KEY);
  localStorage.removeItem(NAME_KEY);
  localStorage.removeItem(DESK_KEY);
}
