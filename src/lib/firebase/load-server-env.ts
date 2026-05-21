import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

let loaded = false;

/** Load `.env` into `process.env` for the Node server (Vite SSR / server functions). */
export function loadServerEnvFile(): void {
  if (loaded) return;
  loaded = true;

  const root = process.cwd();
  const path = resolve(root, ".env");
  if (!existsSync(path)) return;

  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;
    const key = match[1]!;
    let value = match[2]!.trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}
