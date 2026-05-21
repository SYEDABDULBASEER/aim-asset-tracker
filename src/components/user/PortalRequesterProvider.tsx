import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import {
  clearPortalSession,
  readPortalSession,
  writePortalSession,
  type PortalSession,
} from "@/lib/tickets/portal-session";

type PortalRequesterContextValue = PortalSession & {
  hasIdentity: boolean;
  setRequester: (session: PortalSession) => void;
  clearRequester: () => void;
};

const PortalRequesterContext = createContext<PortalRequesterContextValue | null>(null);

/** Employee portal identity — local session only (no Firebase employee accounts). */
export function PortalRequesterProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<PortalSession>(() => readPortalSession());

  const email = session.email.trim();
  const name = session.name.trim();
  const deskNumber = session.deskNumber.trim();
  const hasIdentity = Boolean(session.email.trim());

  const setRequester = useCallback((next: PortalSession) => {
    const normalized: PortalSession = {
      email: next.email.trim(),
      name: next.name.trim(),
      deskNumber: next.deskNumber.trim(),
    };
    writePortalSession(normalized);
    setSession(normalized);
  }, []);

  const clearRequester = useCallback(() => {
    clearPortalSession();
    setSession({ email: "", name: "", deskNumber: "" });
  }, []);

  const value = useMemo(
    () => ({
      email,
      name,
      deskNumber,
      hasIdentity,
      setRequester,
      clearRequester,
    }),
    [email, name, deskNumber, hasIdentity, setRequester, clearRequester],
  );

  return (
    <PortalRequesterContext.Provider value={value}>{children}</PortalRequesterContext.Provider>
  );
}

export function usePortalRequester() {
  const context = useContext(PortalRequesterContext);
  if (!context) {
    throw new Error("usePortalRequester must be used within PortalRequesterProvider");
  }
  return context;
}
