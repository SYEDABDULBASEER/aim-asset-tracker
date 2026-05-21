import { getNativeFetch } from "@/lib/auth/server-fn-client";

type StartOptionsWindow = Window & {
  __TSS_START_OPTIONS__?: { serverFns?: { fetch?: typeof fetch } };
};

async function applyAuthenticatedStartFetch(
  options: NonNullable<StartOptionsWindow["__TSS_START_OPTIONS__"]>,
): Promise<void> {
  const { authenticatedServerFnFetch } = await import("@/lib/auth/authenticated-fetch");
  const baseFetch = getNativeFetch();
  options.serverFns = {
    ...options.serverFns,
    fetch: (input, init) => authenticatedServerFnFetch(baseFetch, input, init),
  };
}

/** Ensures TanStack Start uses authenticated fetch on the client (when options are available). */
export async function ensureStartAuthClient(): Promise<void> {
  if (typeof window === "undefined") return;

  const win = window as StartOptionsWindow;
  if (win.__TSS_START_OPTIONS__) {
    await applyAuthenticatedStartFetch(win.__TSS_START_OPTIONS__);
    return;
  }

  for (let attempt = 0; attempt < 50; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 50));
    if (win.__TSS_START_OPTIONS__) {
      await applyAuthenticatedStartFetch(win.__TSS_START_OPTIONS__);
      return;
    }
  }
}
