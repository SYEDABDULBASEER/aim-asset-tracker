/**
 * Same-origin checks for TanStack Start server functions.
 * Extracted for unit tests; used by {@link ../start.ts}.
 */
export function isServerFnSameOriginAllowed(
  request: Request,
  options: { production: boolean },
): boolean {
  const urlOrigin = new URL(request.url).origin;
  const secFetchSite = request.headers.get("sec-fetch-site");

  if (options.production) {
    const origin = request.headers.get("origin");
    return Boolean(
      (secFetchSite &&
        (secFetchSite === "same-origin" ||
          secFetchSite === "same-site" ||
          secFetchSite === "none")) ||
      (origin && origin === urlOrigin),
    );
  }

  if (
    secFetchSite &&
    (secFetchSite === "same-origin" || secFetchSite === "same-site" || secFetchSite === "none")
  ) {
    return true;
  }

  const origin = request.headers.get("origin");
  if (origin && origin === urlOrigin) {
    return true;
  }

  const referer = request.headers.get("referer");
  if (referer) {
    try {
      return new URL(referer).origin === urlOrigin;
    } catch {
      return false;
    }
  }

  return !options.production;
}
