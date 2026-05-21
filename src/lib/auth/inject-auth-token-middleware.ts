import { createMiddleware } from "@tanstack/react-start";
import { staffWorkspaceAuthRequired } from "@/lib/auth/staff-workspace-auth";
import { FIREBASE_ID_TOKEN_HEADER } from "@/lib/auth/auth-headers";
import { resolveItWorkspaceIdToken } from "@/lib/auth/resolve-it-id-token";

function hasBearerToken(headers: Headers): boolean {
  return (
    headers.has("Authorization") ||
    headers.has("authorization") ||
    headers.has(FIREBASE_ID_TOKEN_HEADER)
  );
}

/** Client-only: attach Firebase ID token to every server function request. */
export const injectAuthTokenMiddleware = createMiddleware({ type: "function" }).client(
  async ({ next, headers: incomingHeaders }) => {
    if (!staffWorkspaceAuthRequired()) {
      return next();
    }

    const headers = new Headers(incomingHeaders as HeadersInit | undefined);
    if (!hasBearerToken(headers)) {
      const token = await resolveItWorkspaceIdToken();
      if (token) {
        const bearer = `Bearer ${token}`;
        headers.set("Authorization", bearer);
        headers.set(FIREBASE_ID_TOKEN_HEADER, bearer);
      }
    }

    return next({ headers: Object.fromEntries(headers.entries()) });
  },
);
