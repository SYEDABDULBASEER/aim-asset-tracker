import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    globals: false,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    exclude: ["**/node_modules/**", "**/dist/**", "**/.venv-import/**", "tests/e2e/**"],
    coverage: {
      provider: "v8",
      include: ["src/lib/**", "src/utils/**"],
      exclude: ["src/**/*.gen.ts", "src/routeTree.gen.ts"],
    },
    environment: "node",
  },
});
