import { spawn, execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, "../..");
const proxyScriptPath = resolve(rootDir, "rotating-proxy.js");

// ─────────────────────────────────────────────
// 端口清理助手：精确杀掉 Windows 占用指定端口的进程
// ─────────────────────────────────────────────
function killProcessOnPorts(ports) {
  if (process.platform !== "win32") return;
  console.log(`[InkOS dev] Checking for occupied ports: ${ports.join(", ")}...`);
  try {
    const output = execSync("netstat -ano", { encoding: "utf-8" });
    const lines = output.split("\n");
    const pidsToKill = new Set();

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      // 匹配 LISTENING 状态的行，获取 PID，如: TCP 0.0.0.0:3000 ... LISTENING 34800
      for (const port of ports) {
        const regex = new RegExp(`:${port}\\s+.*LISTENING\\s+(\\d+)`, "i");
        const match = trimmed.match(regex);
        if (match) {
          const pid = match[1];
          if (pid && pid !== "0" && parseInt(pid, 10) !== process.pid) {
            pidsToKill.add(pid);
          }
        }
      }
    }

    for (const pid of pidsToKill) {
      console.log(`[InkOS dev] Found process ${pid} occupying one of our ports. Terminating...`);
      try {
        execSync(`taskkill /f /pid ${pid}`);
      } catch (err) {
        // 捕获可能发生的权限不足错误，给予提示
        console.warn(`[InkOS dev] ⚠️ Failed to kill process ${pid}. If EADDRINUSE occurs, please try running as Administrator.`);
      }
    }
  } catch (err) {
    console.error("[InkOS dev] Failed to check occupied ports:", err.message);
  }
}

// 启动前先强杀 3000, 4567, 4569 端口的所有残留进程
killProcessOnPorts([3000, 4567, 4569]);

// 设置项目所需的跨平台默认环境变量
process.env.INKOS_STUDIO_PORT = "4569";
process.env.INKOS_PROJECT_ROOT = "../..";

console.log("[InkOS dev] Starting Gemini multi-key rotating proxy on port 3000...");
const proxyProcess = spawn("node", [proxyScriptPath], {
  stdio: "inherit",
  shell: true,
});

console.log("[InkOS dev] Starting backend API server on port 4569...");
const apiProcess = spawn("npx", ["tsx", "watch", "--clear-screen=false", "src/api/index.ts"], {
  stdio: "inherit",
  shell: true,
});

console.log("[InkOS dev] Starting frontend client on port 4567...");
const viteProcess = spawn("npx", ["vite", "--host", "--port", "4567"], {
  stdio: "inherit",
  shell: true,
});

// 统一资源清理与进程退出管理
const cleanup = () => {
  try {
    proxyProcess.kill();
  } catch {}
  try {
    apiProcess.kill();
  } catch {}
  try {
    viteProcess.kill();
  } catch {}
  process.exit();
};

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
process.on("exit", cleanup);
