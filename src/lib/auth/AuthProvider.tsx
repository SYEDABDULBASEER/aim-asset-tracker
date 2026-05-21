import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";

import { isFirebaseConfigured } from "@/lib/firebase/env";
import { getFirebaseAuth } from "@/lib/firebase/init";
import { setAuthSessionUser } from "@/lib/auth/auth-session-ref";
import { registerServerFnIdTokenProvider } from "@/lib/auth/auth-token-bridge";
import { resolveItWorkspaceIdToken } from "@/lib/auth/resolve-it-id-token";
import { staffWorkspaceAuthRequired } from "@/lib/auth/staff-workspace-auth";
import { canWrite, normalizeAppRole, type AppRole } from "@/lib/auth/roles";
import { clearPortalSession } from "@/lib/tickets/portal-session";

export type AuthContextValue = {
  loading: boolean;
  configured: boolean;
  authRequired: boolean;
  /** True after Firebase ID token is cached for the current user (safe to call server functions). */
  sessionReady: boolean;
  user: User | null;
  role: AppRole;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const configured = isFirebaseConfigured();
  const authRequired = staffWorkspaceAuthRequired();
  const prevSessionUidRef = useRef<string | null>(null);

  const [user, setUser] = useState<User | null>(null);
  const [claimRole, setClaimRole] = useState<AppRole>("viewer");
  const [loading, setLoading] = useState(() => Boolean(configured));
  const [sessionReady, setSessionReady] = useState(() => !authRequired);

  useEffect(() => {
    if (!configured) {
      setAuthSessionUser(null);
      setUser(null);
      setClaimRole("viewer");
      setSessionReady(true);
      setLoading(false);
      return;
    }

    const auth = getFirebaseAuth();
    const unsub = onAuthStateChanged(auth, async (nextUser) => {
      setAuthSessionUser(nextUser);
      if (nextUser) {
        await nextUser.getIdToken(true);
        const tokenResult = await nextUser.getIdTokenResult(true);
        setClaimRole(normalizeAppRole(tokenResult.claims.role));
        setSessionReady(true);
      } else {
        setClaimRole("viewer");
        setSessionReady(false);
      }
      setUser(nextUser);
      setLoading(false);
    });

    return () => unsub();
  }, [configured]);

  useEffect(() => {
    if (!sessionReady || !user) return;
    const uid = user.uid;
    if (prevSessionUidRef.current === uid) return;
    prevSessionUidRef.current = uid;
    void queryClient.invalidateQueries();
  }, [sessionReady, user, queryClient]);

  useEffect(() => {
    registerServerFnIdTokenProvider(() => resolveItWorkspaceIdToken());
  }, []);

  /** Effective role for UI: open access when auth is not enforced matches server OPEN_ACCESS. */
  const role = useMemo<AppRole>(() => {
    if (!configured || !authRequired) return "admin";
    return claimRole;
  }, [configured, authRequired, claimRole]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!configured) throw new Error("Firebase is not configured.");
      const auth = getFirebaseAuth();
      await signInWithEmailAndPassword(auth, email.trim(), password);
      const signedIn = auth.currentUser;
      if (signedIn) {
        setAuthSessionUser(signedIn);
        await signedIn.getIdToken(true);
        setSessionReady(true);
      }
    },
    [configured],
  );

  const signOut = useCallback(async () => {
    clearPortalSession();
    setAuthSessionUser(null);
    setSessionReady(false);
    if (configured) await firebaseSignOut(getFirebaseAuth());
  }, [configured]);

  const value = useMemo<AuthContextValue>(
    () => ({
      loading: Boolean(configured && loading),
      configured,
      authRequired,
      sessionReady,
      user: configured ? user : null,
      role,
      signIn,
      signOut,
    }),
    [configured, loading, authRequired, sessionReady, user, role, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

export function useAuthQueryEnabled(): boolean {
  const ctx = useAuth();
  if (!ctx.configured) return true;
  if (!ctx.authRequired) return true;
  return !ctx.loading && ctx.sessionReady && ctx.user !== null;
}

export function useIsAdmin(): boolean {
  return useAuth().role === "admin";
}

export function useCanWriteAssets(): boolean {
  const { role, authRequired, configured } = useAuth();
  if (!configured || !authRequired) return true;
  return canWrite(role, "assets");
}

export function useCanWriteTickets(): boolean {
  const { role, authRequired, configured } = useAuth();
  if (!configured || !authRequired) return true;
  return canWrite(role, "tickets");
}
