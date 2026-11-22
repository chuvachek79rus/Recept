import { copyFileSync, existsSync, mkdirSync } from "node:fs";

const target = "dist/client/index.html";

// TanStack Start SSR does not emit a static index.html. Capacitor still expects
// one in webDir, even when server.url loads the production TanStack server.
if (!existsSync(target)) {
  mkdirSync("dist/client", { recursive: true });
  copyFileSync("capacitor-shell/index.html", target);
  console.log("Added the Capacitor-only index.html fallback.");
}
