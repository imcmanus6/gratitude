# Gratitude → Via65 Identity: migration & unified login

Two independent pieces, both on branch `claude/ecosystem-login`:

1. **Unified login** (code, live now): a handoff landing route so a user coming
   from Briefly (or any ecosystem app) arrives already signed in — no password.
2. **Database consolidation** (operational): move Gratitude's `gratitude` schema
   off its own Supabase project into the shared **Via65** project, so the
   separate project can be retired. Gratitude keeps its own hand-rolled auth;
   each user is *linked* to the canonical Via65 identity by email.

Full single-credential SSO (retiring Gratitude's own passwords entirely and
issuing sessions straight from Supabase Auth) is a larger, separate cutover —
not this change.

## 1. Unified login (already wired)

- `lib/ecosystem.ts` — `verifyBrieflyHandoff` (HMAC-signed, audience-bound token).
- `lib/ecosystem-session.ts` — `resolveGratitudeUser`: reuse-by-canonical-id →
  link-by-verified-email → create a federated account (no local password).
- `app/api/ecosystem/handoff/route.ts` — `GET /api/ecosystem/handoff?token=…&next=/…`
  verifies, resolves the user, mints the normal `gratitude_session` cookie, and
  redirects into the app. Invalid/expired tokens bounce to `/?ecosystem=invalid`.

Requires `ECOSYSTEM_HANDOFF_SECRET` set to the **same** value as Briefly's. In
Briefly, allow this route as a handoff `redirect_uri` for the `gratitude` app.
`users.canonical_id` holds the link (migration `202609260001_add_canonical_id.sql`;
also added to the dev/test SQLite schema).

## 2. Database consolidation into Via65

`scripts/via65-migrate-gratitude.cjs` does the whole move against Via65:
role → schema → grants/policies → data copy → canonical backfill. Dry-run first.

### Prerequisites
- **Admin** Postgres URLs (username `postgres.<ref>`, Session pooler) for both
  projects — NOT the restricted `gratitude_app` role, which can't create schemas.
- `config/supabase-ca.crt` present (already in the repo; Supabase's shared CA
  validates both projects).

### Run
Put the two URLs in a local, gitignored `.env.local` (**never commit them**):

```
GRATITUDE_SOURCE_DB_URL=postgresql://postgres.<gratitude_ref>:<pw>@aws-<n>-<region>.pooler.supabase.com:5432/postgres
VIA65_DB_URL=postgresql://postgres.nnykurgjsvjkfzmfdoyr:<pw>@aws-0-eu-central-1.pooler.supabase.com:5432/postgres
```

```
node scripts/via65-migrate-gratitude.cjs            # dry run — prints the plan
node scripts/via65-migrate-gratitude.cjs --execute  # perform it
```

What it does, in order (all idempotent; re-running is safe):
1. **Role**: creates `gratitude_app` in Via65 if missing, with a fresh random
   password it **prints once** — capture it, you'll need it for the app URL.
2. **Schema**: if `gratitude` is absent in Via65, applies the 6 migration files
   in order (creates tables, FKs, RLS, indexes, the login trigger, canonical_id).
3. **Grants/policies**: `gratitude_app` gets CRUD + a `server_access` RLS policy
   on every table (matches the original project's security model).
4. **Data**: copies every table verbatim (Gratitude keeps its own user ids),
   in FK-safe order, generated columns excluded, `ON CONFLICT DO NOTHING`, with
   the login trigger disabled during the copy so `last_login`/`feed_since` are
   preserved.
5. **Canonical backfill**: links each Gratitude user to the Via65 identity with
   the same email (`users.canonical_id = auth.users.id`), filling NULLs only.

Flags: `--skip-schema`, `--skip-data`, `--skip-backfill` to run parts.

### Cut over the app
Point the app's env at Via65 (the app connects as the **restricted** role, not
admin):

```
SUPABASE_DATABASE_URL=postgresql://gratitude_app.nnykurgjsvjkfzmfdoyr:<role-pw-from-step-1>@aws-0-eu-central-1.pooler.supabase.com:5432/postgres
```

Redeploy. The `search_path=gratitude` in `lib/database.ts` is unchanged, so
every query now hits Via65's `gratitude` schema. Do **not** expose `gratitude`
in Via65's API settings — it's reached only by this direct role, never PostgREST.

### Verify, then retire the old project
- Sign in with an existing account; confirm circles, posts, reminders load.
- Confirm a Briefly → `/api/ecosystem/handoff` link signs you straight in.
- After a few days' confidence, pause/delete the standalone Gratitude Supabase
  project — that's the per-project compute saving.

## Notes
- **Uploads/audio** live in the `uploads` table as `BYTEA` (in the database),
  not Supabase Storage — so they migrate with the row copy. No separate bucket
  move is needed (unlike Meditation).
- **Email collisions**: linking is by exact (lowercased) email. A Gratitude user
  whose email isn't in Via65 stays unlinked (`canonical_id` NULL) and keeps
  working with its own password — handoff will link it the first time that
  person arrives from Briefly.
