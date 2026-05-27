// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { bypassServerFnIdValidationPlugin } from "./src/vite-plugins/bypass-server-fn-id-validation";
import { fixServerFnResolverImportPlugin } from "./src/vite-plugins/fix-server-fn-resolver-import";
import { warmupTanStackServerFnModulesPlugin } from "./src/vite-plugins/warmup-tanstack-server-fn-modules";

// Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
// @cloudflare/vite-plugin builds from this — wrangler.jsonc main alone is insufficient.
export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
    serverFns: {
      /** Same-origin checks live in `src/start.ts` (`sameOriginServerFnMiddleware`). */
      disableCsrfMiddlewareWarning: true,
    },
  },
  vite: {
    server: {
      /** Allow ngrok (and other *.ngrok-free.dev) tunnels in dev — Vite 7 Host header check. */
      allowedHosts: [".ngrok-free.dev"],
    },
    plugins: [
      bypassServerFnIdValidationPlugin(),
      warmupTanStackServerFnModulesPlugin(),
      fixServerFnResolverImportPlugin(),
    ],
    ssr: {
      /** Keep Admin SDK on the Node side — avoids Vite 7 module-runner resolution failures. */
      external: ["firebase-admin", "firebase-admin/app", "firebase-admin/firestore"],
    },
  },
});
