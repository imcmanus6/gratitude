import { spawn } from "node:child_process";
const server = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "start", "-p", process.env.PORT || "3005", "-H", "0.0.0.0"],
  { stdio: "inherit" },
);
const worker = spawn(
  process.execPath,
  ["--import", "tsx", "scripts/reminders.ts"],
  { stdio: "inherit" },
);
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  server.kill("SIGTERM");
  worker.kill("SIGTERM");
  process.exitCode = code;
}
for (const child of [server, worker]) {
  child.on("error", () => stop(1));
  child.on("exit", (code) => stop(code || 0));
}
process.on("SIGINT", () => stop());
process.on("SIGTERM", () => stop());
