# Railway deployment

Project: gratitude-circles (`0056783c-fafd-4a2a-9dee-ab0bb8cd2be2`)
Service: web (`20065557-f33c-409c-a7f8-61cd76105c22`)
Environment: production

Preview: https://web-production-8ef248.up.railway.app
Intended domain: https://gratitude.iskind.net

The production `web` service is connected to `imcmanus6/gratitude` on GitHub and automatically deploys every push to `main`, including pull request merges. Railway builds the repository using the existing Dockerfile and checks `/` before switching traffic.

For a manual deployment, run `railway up --service web --detach` from this directory. The Docker image builds from the lockfile with Node 22, then runs the Next server and reminder worker. PORT is provided by Railway; the local default is 3005. The healthcheck is `/`. Supabase stores persistent application data; no local volume is required. `.railwayignore` and `.dockerignore` exclude local secrets, SQLite data, test artifacts and local dependencies.

Runtime variables were configured from the local environment: restricted SUPABASE_DATABASE_URL, OPENAI_API_KEY and VAPID keys/subject. The administrator database credential is deliberately not deployed. Complimentary paid access remains on. AUTH_ORIGIN uses https://gratitude.iskind.net.

## Domain connection

DigitalOcean is authoritative for iskind.net. The CNAME `gratitude` points to `fivwdqsq.up.railway.app` and the Railway ownership TXT record has been verified. Railway manages TLS issuance. AUTH_ORIGIN is now `https://gratitude.iskind.net`; register that origin and callback URLs in the sign-in providers.

## Remaining launch setup

Apple and Google credentials and the verified transactional email sender/Resend credential are not configured yet. New account registration, email confirmation and password reset require that email setup. The demo and existing verified email accounts can be tested independently. Web reminders are implemented; native iPhone push integration is separate work.
