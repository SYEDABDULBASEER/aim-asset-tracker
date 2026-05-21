import { resolve } from "node:path";
import type { ViteDevServer } from "vite";

const SSR_ENV = "ssr";
const TSS_SERVERFN_SPLIT = "tss-serverfn-split";

/** Decode `/src/foo.ts?query` from a TanStack dev server-fn ID `file` field. */
export function decodeDevServerFnFileField(fileField: string): string {
  let sourceFile = fileField;

  if (sourceFile.startsWith("/@id/")) {
    sourceFile = sourceFile.slice("/@id/".length);
  } else if (sourceFile.startsWith("/@fs/")) {
    sourceFile = sourceFile.slice("/@fs".length);
    sourceFile = sourceFile.replace(/^\/([A-Za-z]:\/)/, "$1");
  } else if (sourceFile.startsWith("/")) {
    sourceFile = sourceFile.slice(1);
  }

  const queryIndex = sourceFile.indexOf("?");
  return queryIndex === -1 ? sourceFile : sourceFile.slice(0, queryIndex);
}

export async function warmupServerFnSplitModule(
  server: ViteDevServer,
  fnId: string,
): Promise<void> {
  let decoded: { file?: string; export?: string };
  try {
    decoded = JSON.parse(Buffer.from(fnId, "base64url").toString("utf8")) as {
      file?: string;
      export?: string;
    };
  } catch {
    return;
  }

  if (typeof decoded.file !== "string") return;

  const ssr = server.environments[SSR_ENV];
  if (!ssr || ssr.mode !== "dev") return;

  const root = server.config.root;
  const sourceFile = decodeDevServerFnFileField(decoded.file);
  const absPath = resolve(root, sourceFile);
  const hasSplitQuery = decoded.file.includes(TSS_SERVERFN_SPLIT);
  const splitUrl = hasSplitQuery
    ? decoded.file.startsWith("/")
      ? decoded.file
      : `/${decoded.file}`
    : `${absPath}?${TSS_SERVERFN_SPLIT}`;

  const urls = [splitUrl, `${absPath}?${TSS_SERVERFN_SPLIT}`];

  for (const url of urls) {
    try {
      if (typeof ssr.warmupRequest === "function") {
        await ssr.warmupRequest(url);
      } else if (typeof server.transformRequest === "function") {
        await server.transformRequest(url, { ssr: true });
      }
    } catch {
      /* try next URL shape */
    }
  }
}
