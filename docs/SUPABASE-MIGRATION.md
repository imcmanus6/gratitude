# Gratitude Supabase database

Target project: Gratitude Circles (`uwpxtkvjolxupkccfoif`) in Via, Ireland. Meditate's project remains separate.

The application's existing relational data moves to Supabase PostgreSQL, in a private `gratitude` schema. The existing server API remains the only access path: the schema and tables are not granted to `anon` or `authenticated` and are not exposed via the Data API. All tables have RLS enabled. A dedicated `gratitude_app` database login has only schema usage and CRUD access, with policies scoped to that server role. The server continues to enforce per-user audience and circle permissions. Do not put the database connection string in a NEXT_PUBLIC variable.

`SUPABASE_DATABASE_URL` is the runtime connection string; the separate admin connection is only for migrations. Certificate verification uses the Supabase CA from the dashboard, stored at `config/supabase-ca.crt`. Runtime connections are pooled and transactions use one connection with AsyncLocalStorage. SQL values are parameterized, not interpolated.

The SQLite snapshot is `.data/backups/pre-supabase.sqlite`. The migration preserves IDs, passwords, sessions, multi-circle joins and image bytes, and verifies row counts and foreign keys before committing. It refuses to overwrite an existing destination schema. Files in `.data` and `.env.local` are private and ignored by git. The old SQLite file is not deleted.

This is the DATABASE migration. Authentication is still the existing server implementation; accounts are in `gratitude.users`, not `auth.users`. Image bytes are in PostgreSQL `gratitude.uploads`, not Supabase Storage. Moving to managed Supabase Auth/Storage requires a separate migration and should not be confused with this switch. Existing passwords remain usable because the hash format is preserved. Google/Apple provider credentials and email delivery configuration are still required before launch.

Production has no SQLite fallback. Unit tests can explicitly select an isolated SQLite fixture using NODE_ENV=test and GRATITUDE_TEST_SQLITE=1. Browser checks run against the configured PostgreSQL backend. Next.js and the reminder worker both read SUPABASE_DATABASE_URL. The web app still needs hosting; placing its database in Supabase does not publish the frontend or create an iPhone app.

Rollback: stop writes, export any PostgreSQL changes made after cutover, then restore the old application and SQLite snapshot. Do not blindly switch to the old snapshot after new data has been written. Keep backups encrypted/access-restricted according to the deployment's backup policy.
