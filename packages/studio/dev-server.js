import { spawn } from "node:child_process";

process.env.INKOS_STUDIO_PORT = "4569";
process.env.INKOS_PROJECT_ROOT = "../..";

console.log("[InkOS dev:server] Starting backend API server on port 4569...");
spawn("npx", ["tsx", "watch", "src/api/index.ts"], {
  stdio: "inherit",
  shell: true,
});
