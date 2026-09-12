import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());
import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.ts",
  timeout: 60000,
  use: { channel: "chrome", viewport: { width: 1440, height: 1000 } },
});
