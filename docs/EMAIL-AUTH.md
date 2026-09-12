# Email sign-in

Apple and Google are the supported social sign-in options. Facebook's public routes are disabled; legacy identity data is retained. Social accounts use their provider for identity verification and password recovery.

Password signup sends a confirmation link and does not create a session. Password login requires `email_verified=1`, including for older password accounts on their next login. Existing sessions are preserved. Resend confirmation is available on the welcome page. Password reset also proves mailbox ownership and signs out existing sessions. OAuth-only accounts cannot acquire a password through this flow.

Configure `RESEND_API_KEY`, `AUTH_EMAIL_FROM` (a verified Resend sender), and `AUTH_ORIGIN` (the canonical HTTPS app origin) in the deployment environment. Without this configuration, email signup and recovery show an explicit unavailable message. No emails are simulated or tokens exposed in API responses. Never commit credentials.

Confirmation links last 24 hours; resets last 30 minutes. Links put the secret in the URL fragment to avoid server access logs. The page removes the fragment and requires a button/form submission, so opening a link does not consume it. Refreshing after opening requires reopening the original email. Tokens are random, hashed in SQLite, single-use, and cascade on account deletion. Reset invalidates all outstanding email tokens and sessions. Confirmation invalidates outstanding confirmation links. Requests are limited to five per email per 15 minutes with hashed email keys. Successful forgot/resend responses do not disclose account existence.

Tests mock the delivery API and never send real email. Native app builds will still need universal-link/deep-link handling for these HTTPS links; they currently open the web confirmation/reset page.
