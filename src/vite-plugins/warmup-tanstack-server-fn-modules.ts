import fs from "node:fs";
import path from "node:path";
import type { Plugin, ViteDevServer } from "vite";

const SERVER_FN_LOOKUP = "server-fn-module-lookup";
const TSS_SERVERFN_SPLIT = "tss-serverfn-split";
const SSR_ENV = "ssr";

function viteRootUrl(root: string, absoluteFile: string): string {
  const normalizedRoot = root.replace(/\\/g, "/");
  const rootPrefix = normalizedRoot.endsWith("/") ? normalizedRoot : `${normalizedRoot}/`;
  const normalizedFile = absoluteFile.replace(/\\/g, "/");
  if (normalizedFile.startsWith(rootPrefix)) {
    return `/${normalizedFile.slice(rootPrefix.length)}`;
  }
  return `/@fs/${normalizedFile}`;
}

function listUtilServerFnFiles(root: string): string[] {
  const utilsDir = path.join(root, "src", "utils");
  if (!fs.existsSync(utilsDir)) return [];
  return fs
    .readdirSync(utilsDir)
    .filter((name) => name.endsWith(".functions.ts"))
    .map((name) => path.join(utilsDir, name));
}

async function warmupSsrModule(server: ViteDevServer, requestUrl: string): Promise<void> {
  const ssr = server.environments[SSR_ENV];
  if (!ssr || ssr.mode !== "dev") return;

  if (typeof ssr.warmupRequest === "function") {
    await ssr.warmupRequest(requestUrl);
    return;
  }

  if (typeof server.transformRequest === "function") {
    await server.transformRequest(requestUrl, { ssr: true });
  }
}

/**
 * Pre-compile server function provider modules in the SSR environment so the split handlers
 * (`?tss-serverfn-split`) exist before the first RPC.
 */
export function warmupTanStackServerFnModulesPlugin(): Plugin {
  return {
    name: "assetdesk-warmup-tanstack-server-fn-modules",
    apply: "serve",
    configureServer(server) {
      const files = listUtilServerFnFiles(server.config.root);
      if (files.length === 0) return;

      const runWarmup = () => {
        void (async () => {
          for (const file of files) {
            const rootUrl = viteRootUrl(server.config.root, file);
            for (const url of [
              `${file}?${SERVER_FN_LOOKUP}`,
              `${file}?${TSS_SERVERFN_SPLIT}`,
              `${rootUrl}?${SERVER_FN_LOOKUP}`,
              `${rootUrl}?${TSS_SERVERFN_SPLIT}`,
            ]) {
              try {
                await warmupSsrModule(server, url);
              } catch {
                /* non-fatal; bypass plugin warms per-request too */
              }
            }
          }
        })();
      };

      if (server.httpServer?.listening) {
        runWarmup();
      } else {
        server.httpServer?.once("listening", runWarmup);
      }
    },
  };
}
