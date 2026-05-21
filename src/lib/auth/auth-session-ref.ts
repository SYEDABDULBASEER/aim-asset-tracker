import type { User } from "firebase/auth";

/**
 * Synchronous Firebase session pointer updated in `onAuthStateChanged` before React state
 * commits. Avoids a race where React Query runs before the token provider `useEffect` runs.
 */
let sessionUser: User | null = null;

export function setAuthSessionUser(user: User | null): void {
  sessionUser = user;
}

export function getAuthSessionUser(): User | null {
  return sessionUser;
}
