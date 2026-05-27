import { createStart, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import {
  EMPLOYEE_PORTAL_FN_HEADER,
  EMPLOYEE_PORTAL_FN_HEADER_VALUE,
  PORTAL_GUEST_SERVER_AUTH,
} from "./lib/auth/employee-portal";
import { runWithRequestContext, type ServerAuthContext } from "./lib/auth/request-context";
import { attachAuthToRequest } from "./lib/auth/require-auth";
import { injectAuthTokenMiddleware } from "./lib/auth/inject-auth-token-middleware";
import { isServerFnSameOriginAllowed } from "./lib/auth/same-origin-server-fn";
import { extractBearerToken, verifyFirebaseIdToken } from "./lib/auth/server";
import { FIREBASE_ID_TOKEN_HEADER } from "./lib/auth/auth-headers";
import { staffWorkspaceAuthRequired } from "./lib/auth/staff-workspace-auth";

type MiddlewareContext = { handlerType?: string };

const OPEN_ACCESS_AUTH: ServerAuthContext = {
  uid: "open-access",
  email: null,
  role: "admin",
};

const sameOriginServerFnMiddleware = createMiddleware().server(({ next, request, ...args }) => {
  if ((args as MiddlewareContext).handlerType !== "serverFn") {
    return next();
  }

  if (
    !isServerFnSameOriginAllowed(request, {
      production: Boolean(import.meta.env.PROD),
    })
  ) {
    return new Response("Forbidden", { status: 403 });
  }

  return next();
});

const authServerFnMiddleware = createMiddleware().server(async ({ next, request, ...args }) => {
  if ((args as MiddlewareContext).handlerType !== "serverFn") {
    return next();
  }

  if (!staffWorkspaceAuthRequired()) {
    attachAuthToRequest(request, OPEN_ACCESS_AUTH);
    return runWithRequestContext({ auth: OPEN_ACCESS_AUTH }, () => next());
  }

  const token =
    extractBearerToken(request.headers.get("authorization")) ??
    extractBearerToken(request.headers.get(FIREBASE_ID_TOKEN_HEADER));
  if (!token) {
    /** Employee portal ticket APIs: same-origin requests with this header use a synthetic guest context (no Firebase account). */
    const portalFn = request.headers.get(EMPLOYEE_PORTAL_FN_HEADER);
    if (portalFn === EMPLOYEE_PORTAL_FN_HEADER_VALUE) {
      return runWithRequestContext({ auth: PORTAL_GUEST_SERVER_AUTH }, () => next());
    }
    return new Response(JSON.stringify({ message: "Sign in required." }), {
      status: 401,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }

  try {
    const verified = await verifyFirebaseIdToken(token);
    const auth: ServerAuthContext = {
      uid: verified.uid,
      email: verified.email,
      role: verified.role,
    };
    attachAuthToRequest(request, auth);
    return runWithRequestContext({ auth }, () => next());
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error("authServerFnMiddleware: token verification failed", error);
    }
    return new Response(JSON.stringify({ message: "Invalid or expired session. Sign in again." }), {
      status: 401,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }
});

const errorMiddleware = createMiddleware().server(async ({ next, context }) => {
  try {
    return await next();
  } catch (error) {
    const handlerType = (context as MiddlewareContext | undefined)?.handlerType;
    if (error != null && typeof error === "object" && "statusCode" in error) {
      const statusCode = Number((error as { statusCode: number }).statusCode) || 500;
      if (handlerType === "serverFn") {
        const message = error instanceof Error ? error.message : "Server function failed";
        return new Response(JSON.stringify({ message }), {
          status: statusCode,
          headers: { "content-type": "application/json; charset=utf-8" },
        });
      }
    }
    console.error(error);
    if (handlerType === "serverFn") {
      const message = error instanceof Error ? error.message : "Server function failed";
      return new Response(JSON.stringify({ message }), {
        status: 500,
        headers: { "content-type": "application/json; charset=utf-8" },
      });
    }
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

export const startInstance = createStart(() => ({
  requestMiddleware: [sameOriginServerFnMiddleware, authServerFnMiddleware, errorMiddleware],
  functionMiddleware: [injectAuthTokenMiddleware],
}));
