import { createStart, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { runWithRequestContext } from "./lib/auth/request-context";
import { injectAuthTokenMiddleware } from "./lib/auth/inject-auth-token-middleware";
import { extractBearerToken, verifyFirebaseIdToken } from "./lib/auth/server";
import { allowDemoAuthInDevelopment, isFirebaseConfigured } from "./lib/firebase/env";

const sameOriginServerFnMiddleware = createMiddleware().server(({ next, request, context }) => {
  if (context.handlerType !== "serverFn") {
    return next();
  }

  const urlOrigin = new URL(request.url).origin;
  const secFetchSite = request.headers.get("sec-fetch-site");

  if (import.meta.env.PROD) {
    const origin = request.headers.get("origin");
    const allowed =
      (secFetchSite &&
        (secFetchSite === "same-origin" ||
          secFetchSite === "same-site" ||
          secFetchSite === "none")) ||
      (origin && origin === urlOrigin);
    if (!allowed) {
      return new Response("Forbidden", { status: 403 });
    }
  } else {
    if (
      secFetchSite &&
      (secFetchSite === "same-origin" || secFetchSite === "same-site" || secFetchSite === "none")
    ) {
      // allowed
    } else {
      const origin = request.headers.get("origin");
      if (origin && origin === urlOrigin) {
        // allowed
      } else {
        const referer = request.headers.get("referer");
        if (referer) {
          try {
            if (new URL(referer).origin !== urlOrigin) {
              return new Response("Forbidden", { status: 403 });
            }
          } catch {
            return new Response("Forbidden", { status: 403 });
          }
        } else if (import.meta.env.PROD) {
          return new Response("Forbidden", { status: 403 });
        }
      }
    }
  }

  return next();
});

const authServerFnMiddleware = createMiddleware().server(async ({ next, request, context }) => {
  if (context.handlerType !== "serverFn") {
    return next();
  }

  const token = extractBearerToken(request.headers.get("authorization"));
  let auth = null;

  if (token && isFirebaseConfigured()) {
    try {
      auth = await verifyFirebaseIdToken(token);
    } catch (error) {
      if (allowDemoAuthInDevelopment()) {
        console.warn("Auth verification failed (demo auth mode)", error);
        auth = null;
      } else {
        console.error("Auth verification failed", error);
        return new Response(JSON.stringify({ message: "Invalid authentication token." }), {
          status: 401,
          headers: { "content-type": "application/json; charset=utf-8" },
        });
      }
    }
  }

  return runWithRequestContext({ auth }, () => next());
});

const errorMiddleware = createMiddleware().server(async ({ next, context }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      const statusCode = Number((error as { statusCode: number }).statusCode) || 500;
      if (context.handlerType === "serverFn") {
        const message = error instanceof Error ? error.message : "Server function failed";
        return new Response(JSON.stringify({ message }), {
          status: statusCode,
          headers: { "content-type": "application/json; charset=utf-8" },
        });
      }
    }
    console.error(error);
    if (context.handlerType === "serverFn") {
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
