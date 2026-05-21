/** Whether an error message indicates missing or expired IT session (vs server/data errors). */
export function isAuthListQueryError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  const lower = message.toLowerCase();
  return (
    lower.includes("sign in required") ||
    lower.includes("invalid or expired session") ||
    lower.includes("session required") ||
    message.includes("(401)")
  );
}

/** Normalize React Query / server function errors for list page banners. */
export function formatListQueryError(error: unknown): string {
  const message = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  if (!message.trim()) return "Something went wrong.";

  if (isAuthListQueryError(error)) {
    if (message.toLowerCase().includes("invalid or expired session")) {
      return "Your session expired. Sign in again to continue.";
    }
    return "Sign in required. Use the IT login page, then retry.";
  }

  const lower = message.toLowerCase();
  if (lower.includes("forbidden") || message.includes("(403)")) {
    return "You do not have permission to view this data.";
  }

  if (message.includes("<!doctype html") || message.includes("This page didn't load")) {
    return "The server returned an unexpected error. Refresh the page or restart the dev server.";
  }

  return message;
}

/** Assets list: enum migration and validation messages. */
export function formatAssetsQueryError(error: unknown): string {
  const message = formatListQueryError(error);
  if (isAuthListQueryError(error)) return message;

  if (message.includes("invalid_enum_value") && message.includes("Servers")) {
    return "Some assets still use the old category “Servers”. Refresh the page; they are shown as Desktop.";
  }
  if (message.startsWith("[") && message.includes("invalid_enum_value")) {
    return "Some asset records could not be loaded because they use outdated values. Refresh the page or restart the dev server.";
  }
  return message;
}
