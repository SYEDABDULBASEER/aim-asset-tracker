import { createMiddleware } from "@tanstack/react-start";
import { appendFirebaseAuthHeader } from "@/lib/auth/firebase-auth-header";

/** Client-only: attach Firebase ID token to every server function request. */
export const injectAuthTokenMiddleware = createMiddleware({ type: "function" }).client(
  async ({ next, headers: existing }) => {
    try {
      const headers = new Headers(existing);
      await appendFirebaseAuthHeader(headers);
      if (headers.has("Authorization")) return next({ headers: Object.fromEntries(headers.entries()) });
    } catch (error) {
      console.warn("injectAuthTokenMiddleware: could not attach auth token", error);
    }
    return next();
  },
);
