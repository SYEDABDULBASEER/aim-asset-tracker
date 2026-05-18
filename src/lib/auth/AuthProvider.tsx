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

import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from "firebase/auth";

import { allowDemoAuthInDevelopment, firebaseAuthRequired, isFirebaseConfigured } from "@/lib/firebase/env";

import { getFirebaseAuth } from "@/lib/firebase/init";
import { getDevPersona } from "@/lib/auth/dev-persona";

import {
  installAuthenticatedServerFetch,
  useAuthenticatedServerFetch,
} from "@/lib/auth/server-fn-client";

if (typeof window !== "undefined") {
  installAuthenticatedServerFetch();
}

import { canWrite, normalizeAppRole, type AppRole } from "@/lib/auth/roles";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  configured: boolean;
  role: AppRole;
  signIn: (email: string, password: string) => Promise<AppRole>;
  signOut: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
  refreshRole: () => Promise<AppRole>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/** Custom claims are not in the JWT until the token is refreshed after signup / setCustomUserClaims. */
async function readRoleFromUser(
  user: User | null,
  options?: { forceRefresh?: boolean },
): Promise<AppRole> {
  if (!user) return "viewer";

  if (options?.forceRefresh) {
    await user.getIdToken(true);
  }

  let tokenResult = await user.getIdTokenResult();
  if (tokenResult.claims.role === undefined) {
    await user.getIdToken(true);
    tokenResult = await user.getIdTokenResult();
  }

  return normalizeAppRole(tokenResult.claims.role);
}

function AuthSessionQuerySync() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const lastUid = useRef<string | null>(null);

  useEffect(() => {
    if (auth.loading) return;
    const uid = auth.user?.uid ?? null;
    if (uid === lastUid.current) return;
    lastUid.current = uid;
    if (uid) void queryClient.invalidateQueries();
  }, [auth.loading, auth.user?.uid, queryClient]);

  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isFirebaseConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(configured);
  const [role, setRole] = useState<AppRole>("viewer");

  useAuthenticatedServerFetch();

  useEffect(() => {
    if (!configured) {
      setRole("admin");
      setLoading(false);
      return;
    }

    if (allowDemoAuthInDevelopment()) {
      setUser(null);
      const persona = getDevPersona();
      setRole(persona === "user" ? "user" : "admin");
      setLoading(false);
      return;
    }

    const auth = getFirebaseAuth();

    return onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      setRole(await readRoleFromUser(nextUser));
      setLoading(false);
    });
  }, [configured]);

  const refreshRole = useCallback(async () => {
    const auth = getFirebaseAuth();
    const current = auth.currentUser;
    if (!current) {
      setRole("viewer");
      return "viewer";
    }
    await current.getIdToken(true);
    const nextRole = await readRoleFromUser(current);
    setRole(nextRole);
    return nextRole;
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const auth = getFirebaseAuth();
    const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
    const nextRole = await readRoleFromUser(credential.user, { forceRefresh: true });
    setUser(credential.user);
    setRole(nextRole);
    return nextRole;
  }, []);

  const signOutUser = useCallback(async () => {
    const auth = getFirebaseAuth();
    await signOut(auth);
    setUser(null);
    setRole("viewer");
  }, []);

  const getIdToken = useCallback(async () => {
    const auth = getFirebaseAuth();
    const current = auth.currentUser;
    if (!current) return null;
    return current.getIdToken();
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      configured,
      role,
      signIn,
      signOut: signOutUser,
      getIdToken,
      refreshRole,
    }),
    [user, loading, configured, role, signIn, signOutUser, getIdToken, refreshRole],
  );

  return (
    <AuthContext.Provider value={value}>
      <AuthSessionQuerySync />
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

/** Wait for Firebase session before firing authenticated server function queries. */
export function useAuthQueryEnabled(): boolean {
  const auth = useAuth();
  if (!firebaseAuthRequired()) return true;
  return !auth.loading && Boolean(auth.user);
}

export function useIsAdmin(): boolean {
  const { configured, role } = useAuth();
  if (!configured) return true;
  return role === "admin";
}

export function useCanWriteAssets(): boolean {
  const { configured, role } = useAuth();
  if (!configured) return true;
  return canWrite(role, "assets");
}
