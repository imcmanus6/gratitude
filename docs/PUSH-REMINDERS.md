# Daily phone reminders

Settings → Your daily gratitude reminder → Remind me at 9 p.m. is an explicit opt-in per device, independent of circle schedules. Accounts in the demo cannot subscribe. The browser asks for notification permission. The reminder repeats daily even if the user has already posted. Preview notification tests local display, not server delivery.

This repository currently ships a web app and an Android Google Play Trusted Web Activity (TWA), not native iOS/Android binaries. Web Push requires HTTPS (localhost is allowed for development). On iPhone/iPad, add the live app to the Home Screen and open it there before enabling notifications. The Android TWA uses Chrome and the existing PWA service worker; native iOS store builds would need their own APNs/FCM or local-notification integration.

`npm start` starts both Next.js and a separate reminder worker. Deploy it as an always-on Node process with persistent SQLite storage, preserving this startup command. The worker checks every 30 seconds; an asleep laptop or stopped server cannot send. For a separate worker deployment use `npm run reminders` with the same persistent database and environment. A serverless Next deployment alone does not run this worker.

Configure VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY and VAPID_SUBJECT in the deployment environment. Generate a key pair once with web-push.generateVAPIDKeys(); never rotate it casually or expose the private key. Local keys are configured in the ignored .env.local. The contact subject is mailto:gratitude@iskind.net; it does not send email or require an email-service API key.

The selected device time zone is saved when enabling. DST is automatic. When travelling, disable and enable to use the new device time zone. Reminders dispatch between 21:00 and 21:15 local time, with a 15-minute push TTL, persistent daily deduplication, and a two-minute retry lease. Expired subscriptions (404/410) are deleted. Rare duplicate delivery after a worker crash is possible; a daily notification tag and fixed push topic coalesce retries. OS focus modes, offline devices and push-provider delays can defer or suppress display.

Only known HTTPS browser push-service domains are accepted. Subscriptions belong to the authenticated user, are capped at ten per account, and cascade on account deletion. Turning reminders off removes this device's server subscription and browser subscription. Signing out does not disable the opted-in daily reminder (the payload contains no personal content); turn reminders off in Settings if using a shared device. Notifications open the app home page, where Add gratitude is in the top bar.

Tests mock push delivery; actual phone delivery must be verified on the deployed HTTPS app with device permission. No device permission has been granted on the user's behalf.
