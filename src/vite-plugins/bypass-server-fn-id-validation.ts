import type { Plugin, ViteDevServer } from "vite";
import { warmupServerFnSplitModule } from "./server-fn-ssr-warmup";

const VALIDATE_MODULE_MARKER = "tanstack-start-validate-server-fn-id";

function parseFnIdFromModuleId(id: string): string | null {
  const queryIndex = id.indexOf("?");
  if (queryIndex === -1) return null;
  return new URLSearchParams(id.slice(queryIndex + 1)).get("id");
}

function isDecodableServerFnId(fnId: string): boolean {
  try {
    const decoded = JSON.parse(Buffer.from(fnId, "base64url").toString("utf8")) as {
      file?: unknown;
      export?: unknown;
    };
    return typeof decoded.file === "string" && typeof decoded.export === "string";
  } catch {
    return false;
  }
}

/**
 * TanStack's `validate-server-fn-id` plugin lazy-compiles via `environment.transformRequest`,
 * which fails under Vite 7's SSR module runner for Firebase-backed server modules (RunnerError).
 * We return `{}` for the validator and pre-warm the split handler in the SSR environment so
 * `getServerFnById` can import it on the first RPC.
 */
export function bypassServerFnIdValidationPlugin(): Plugin {
  let devServer: ViteDevServer | undefined;

  return {
    name: "assetdesk-bypass-server-fn-id-validation",
    apply: "serve",
    enforce: "pre",
    configureServer(server) {
      devServer = server;
    },
    async load(id) {
      if (!id.includes(VALIDATE_MODULE_MARKER)) return;
      const fnId = parseFnIdFromModuleId(id);
      if (!fnId || !isDecodableServerFnId(fnId)) return;

      if (devServer) {
        await warmupServerFnSplitModule(devServer, fnId);
      }

      return "export {}";
    },
  };
}
