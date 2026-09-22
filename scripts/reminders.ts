import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
require("@next/env").loadEnvConfig(process.cwd());
async function main() {
  const {
    dispatchEmailReminders,
    dispatchReminders,
    emailReminderConfigured,
    pushConfiguration,
  } = await import("../lib/push");
  if (!pushConfiguration())
    console.log("Phone reminders await VAPID configuration.");
  if (!emailReminderConfigured())
    console.log("Email reminders await Resend configuration.");
  while (true) {
    try {
      await dispatchReminders();
    } catch {
      console.error("Reminder worker failed a check; retrying.");
    }
    try {
      await dispatchEmailReminders();
    } catch {
      console.error("Email reminder worker failed a check; retrying.");
    }
    await new Promise((resolve) => setTimeout(resolve, 30000));
  }
}
void main();
