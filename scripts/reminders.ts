import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
require("@next/env").loadEnvConfig(process.cwd());
async function main() {
  const { dispatchReminders, pushConfiguration } = await import("../lib/push");
  if (!pushConfiguration())
    console.log("Phone reminders await VAPID configuration.");
  while (true) {
    try {
      await dispatchReminders();
    } catch {
      console.error("Reminder worker failed a check; retrying.");
    }
    await new Promise((resolve) => setTimeout(resolve, 30000));
  }
}
void main();
