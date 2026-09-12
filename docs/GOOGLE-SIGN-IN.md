# Google sign-in setup

Both apps use separate Google Cloud projects under the owner's Gmail account. Brief-ly was not modified.

## Gratitude Circles

- Google project: `elevated-glow-508421-b8` (Gratitude Circles)
- Client: Gratitude Circles web
- Callback URLs: `http://localhost:3005/api/auth/social/google/callback` and `https://gratitude.iskind.net/api/auth/social/google/callback`
- Credentials are in ignored `.env.local` and Railway web-service variables, not this document.
- Local AUTH_ORIGIN is `http://localhost:3005`; Railway AUTH_ORIGIN is `https://gratitude.iskind.net`.
- Uses the app's existing custom OAuth/authentication implementation and separate Supabase PostgreSQL database.

## Meditate

- Google project: `meta-will-508421-b6` (Meditate by NAI)
- Client: Meditate web
- Google callback: `https://bwostoixbhdrtfgclrrb.supabase.co/auth/v1/callback`
- OAuth credentials saved in Meditate's Supabase Google provider.
- Supabase Site URL: `https://meditate.iskind.net`
- Existing live redirect wildcard retained: `https://meditate.iskind.net/**`
- Local redirect added: `http://localhost:3006/auth/callback`
- Local web app includes buttons and callback page. These Meditate UI changes have not yet been deployed.

## Before public release

Both Google OAuth projects are in Testing, with `imcmanus6@gmail.com` added as a test user. Complete public branding/privacy-policy details and publish the OAuth apps for general use. The current integration requests basic identity/email only.

Apple remains disabled pending Apple Developer Program enrolment and credential setup. Native Google/Apple sign-in integration is separate from this web OAuth setup.
