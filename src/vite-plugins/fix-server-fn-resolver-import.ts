import { resolve } from "node:path";
import type { Plugin } from "vite";

const RESOLVER_MARKER = "tanstack-start-server-fn-resolver";
const IMPORT_RE =
  /await import\(\/\* @vite-ignore \*\/ devServerFn\.file\)/;

/**
 * TanStack dev `getServerFnById` imports `devServerFn.file` (e.g. `/src/utils/foo.ts?split`).
 * Vite 7's SSR module runner often resolves that as bare `src/utils/foo.ts` and fails.
 * Rewrite to `/@fs/<absolute>` so the split handler loads reliably.
 */
export function fixServerFnResolverImportPlugin(): Plugin {
  let root = process.cwd();

  return {
    name: "assetdesk-fix-server-fn-resolver-import",
    apply: "serve",
    enforce: "post",
    configResolved(config) {
      root = config.root;
    },
    transform(code, id) {
      if (!id.includes(RESOLVER_MARKER)) return;
      if (!IMPORT_RE.test(code)) return;

      const helper = `
import { resolve as __assetdeskPathResolve } from "node:path";
const __assetdeskProjectRoot = ${JSON.stringify(root)};
function __assetdeskResolveServerFnImport(file) {
  if (typeof file !== "string" || !file) return file;
  if (file.startsWith("/@fs")) return file;
  const qIdx = file.indexOf("?");
  const query = qIdx >= 0 ? file.slice(qIdx) : "";
  let pathPart = qIdx >= 0 ? file.slice(0, qIdx) : file;
  if (pathPart.startsWith("/")) pathPart = pathPart.slice(1);
  const abs = __assetdeskPathResolve(__assetdeskProjectRoot, pathPart).replace(/\\\\/g, "/");
  return "/@fs" + (abs.startsWith("/") ? abs : "/" + abs) + query;
}
`;

      return {
        code:
          helper +
          code.replace(
            IMPORT_RE,
            "await import(/* @vite-ignore */ __assetdeskResolveServerFnImport(devServerFn.file))",
          ),
        map: null,
      };
    },
  };
}
