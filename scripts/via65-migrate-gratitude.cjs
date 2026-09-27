/**
 * via65-migrate-gratitude — move Gratitude's `gratitude` schema from its own
 * Supabase project into the shared Via65 Identity project.
 *
 * Gratitude already lives in a `gratitude` schema behind a restricted
 * `gratitude_app` role, so consolidation is: recreate that schema + role in
 * Via65, copy every row verbatim (Gratitude keeps its OWN users — hand-rolled
 * auth is untouched here), then link each user to the ecosystem's canonical
 * identity by matching email against Via65's auth.users (users.canonical_id).
 * Unified login itself is the /api/ecosystem/handoff route; this is the data move.
 *
 *   Env (admin Postgres URLs — postgres.<ref>, NOT the gratitude_app role):
 *     GRATITUDE_SOURCE_DB_URL  (source — current Gratitude project; falls back
 *                               to SUPABASE_DATABASE_ADMIN_URL / SUPABASE_DATABASE_URL)
 *     VIA65_DB_URL             (dest   — Via65 project)
 *
 *   Dry run (default): node scripts/via65-migrate-gratitude.cjs
 *   Execute:           node scripts/via65-migrate-gratitude.cjs --execute
 *   Skip parts:        --skip-schema | --skip-data | --skip-backfill
 *
 * Idempotent: schema is applied only if absent; grants/policies use IF-style
 * guards; data is ON CONFLICT DO NOTHING; the canonical backfill only fills
 * NULLs. Run the dry run first and read the plan before --execute. RUN AGAINST
 * A VIA65 STAGING COPY BEFORE PROD.
 */
require('@next/env').loadEnvConfig(process.cwd());
const fs = require('fs');
const path = require('path');
const { randomBytes } = require('crypto');
const { Client } = require('pg');

const EXECUTE = process.argv.includes('--execute');
const SKIP_SCHEMA = process.argv.includes('--skip-schema');
const SKIP_DATA = process.argv.includes('--skip-data');
const SKIP_BACKFILL = process.argv.includes('--skip-backfill');

const CA = fs.readFileSync(path.join(process.cwd(), 'config/supabase-ca.crt'), 'utf8');
const MIGRATIONS_DIR = path.join(process.cwd(), 'supabase/migrations');
// Applied in filename (chronological) order; the base file must run first.
const MIGRATION_FILES = fs.readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql')).sort();

// FK-safe copy order (parents before children) so a plain insert never violates
// a foreign key. Any table not listed is copied last (defensive).
const COPY_ORDER = [
  'users', 'email_limits', 'departure_feedback',
  'uploads', 'circles',
  'auth_sessions', 'oauth_identities', 'oauth_attempts', 'blocks', 'email_tokens',
  'push_subscriptions', 'email_reminders', 'api_keys', 'image_generations',
  'oauth_receipts',
  'members', 'sessions',
  'posts',
  'reactions', 'comments', 'reports', 'post_circles', 'circle_invitations',
];
// Preserve original insertion order where a table has a generated rowid.
const ORDER_BY = { circles: 'rowid' };

function connect(url) {
  return new Client({ connectionString: url, ssl: { rejectUnauthorized: true, ca: CA } });
}
function describe(url) {
  try { const u = new URL(url); return `host=${u.hostname} user=${u.username} db=${u.pathname.replace(/^\//, '')}`; }
  catch { return '(unparseable — expect postgres.<ref>:<pw>@<pooler-host>:5432/postgres)'; }
}
async function tableExists(c, schema, table) {
  return (await c.query('SELECT 1 FROM information_schema.tables WHERE table_schema=$1 AND table_name=$2', [schema, table])).rowCount > 0;
}
async function insertableColumns(c, table) {
  const r = await c.query(
    "SELECT column_name FROM information_schema.columns WHERE table_schema='gratitude' AND table_name=$1 AND is_generated <> 'ALWAYS' ORDER BY ordinal_position",
    [table],
  );
  return r.rows.map((x) => x.column_name);
}
async function count(c, table) {
  return (await c.query(`SELECT count(*)::int n FROM gratitude."${table}"`)).rows[0].n;
}

async function ensureRole(dst) {
  const exists = (await dst.query("SELECT 1 FROM pg_roles WHERE rolname='gratitude_app'")).rowCount > 0;
  if (exists) { console.log('role gratitude_app: already exists (leaving credentials unchanged)'); return; }
  if (!EXECUTE) { console.log('role gratitude_app: MISSING — would create with a fresh random password'); return; }
  const password = randomBytes(24).toString('hex');
  await dst.query(`CREATE ROLE gratitude_app LOGIN PASSWORD '${password}' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS`);
  const ref = new URL(process.env.VIA65_DB_URL).username.split('.').pop();
  console.log('role gratitude_app: CREATED. Store this app connection string (goes in the app env, never committed):');
  console.log(`  SUPABASE_DATABASE_URL=postgresql://gratitude_app.${ref}:${password}@<via65-pooler-host>:5432/postgres`);
}

async function applySchema(dst) {
  const already = await tableExists(dst, 'gratitude', 'users');
  if (already) { console.log('schema: gratitude.users already present — skipping migration apply'); return; }
  if (!EXECUTE) { console.log(`schema: gratitude schema absent — would apply ${MIGRATION_FILES.length} migration files: ${MIGRATION_FILES.join(', ')}`); return; }
  for (const f of MIGRATION_FILES) {
    await dst.query(fs.readFileSync(path.join(MIGRATIONS_DIR, f), 'utf8'));
    console.log(`  applied ${f}`);
  }
}

async function ensureGrantsAndPolicies(dst) {
  if (!EXECUTE) { console.log('grants/policies: would grant gratitude_app CRUD + a server_access policy on every table'); return; }
  await dst.query('GRANT USAGE ON SCHEMA gratitude TO gratitude_app');
  await dst.query('GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA gratitude TO gratitude_app');
  await dst.query('GRANT USAGE,SELECT ON ALL SEQUENCES IN SCHEMA gratitude TO gratitude_app');
  const tables = (await dst.query("SELECT tablename FROM pg_tables WHERE schemaname='gratitude'")).rows;
  for (const { tablename } of tables) {
    try {
      await dst.query(`CREATE POLICY server_access ON gratitude."${tablename}" TO gratitude_app USING (true) WITH CHECK (true)`);
    } catch (e) {
      if (!/already exists/i.test(e.message)) throw e;
    }
  }
  console.log(`grants/policies: ensured on ${tables.length} tables`);
}

async function copyData(src, dst) {
  const srcTables = (await src.query("SELECT tablename FROM pg_tables WHERE schemaname='gratitude'")).rows.map((r) => r.tablename);
  const ordered = [...COPY_ORDER.filter((t) => srcTables.includes(t)), ...srcTables.filter((t) => !COPY_ORDER.includes(t))];
  let disabled = false;
  try {
    if (EXECUTE && srcTables.includes('auth_sessions')) {
      await dst.query('ALTER TABLE gratitude.auth_sessions DISABLE TRIGGER track_gratitude_login');
      disabled = true;
    }
    let total = 0;
    for (const table of ordered) {
      const cols = await insertableColumns(src, table);
      if (!cols.length) { console.log(`  ${table}: no columns?! skipped`); continue; }
      const quoted = cols.map((c) => `"${c}"`).join(',');
      const order = ORDER_BY[table] ? ` ORDER BY "${ORDER_BY[table]}"` : '';
      const rows = (await src.query(`SELECT ${quoted} FROM gratitude."${table}"${order}`)).rows;
      let inserted = 0;
      if (EXECUTE) {
        for (const row of rows) {
          const vals = cols.map((c) => row[c]);
          const ph = cols.map((_, i) => `$${i + 1}`).join(',');
          const res = await dst.query(`INSERT INTO gratitude."${table}" (${quoted}) VALUES (${ph}) ON CONFLICT DO NOTHING`, vals);
          inserted += res.rowCount;
        }
      }
      total += rows.length;
      console.log(`  ${table.padEnd(20)} source=${String(rows.length).padStart(6)} inserted=${inserted} (${cols.length} cols)`);
    }
    console.log(`data: ${total} source rows across ${ordered.length} tables`);
  } finally {
    if (disabled) await dst.query('ALTER TABLE gratitude.auth_sessions ENABLE TRIGGER track_gratitude_login');
  }
}

async function backfillCanonical(dst) {
  // Link Gratitude users to the ecosystem identity by verified email.
  const matchable = (await dst.query(
    `SELECT count(*)::int n FROM gratitude.users u JOIN auth.users a ON lower(a.email)=lower(u.email) WHERE u.canonical_id IS NULL`,
  )).rows[0].n;
  if (!EXECUTE) { console.log(`canonical backfill: ${matchable} unlinked Gratitude user(s) match a Via65 auth.users email — would link`); return; }
  const res = await dst.query(
    `UPDATE gratitude.users u SET canonical_id = a.id
       FROM auth.users a
      WHERE lower(a.email) = lower(u.email) AND u.canonical_id IS NULL`,
  );
  console.log(`canonical backfill: linked ${res.rowCount} Gratitude user(s) to their Via65 identity`);
}

(async () => {
  const SOURCE = process.env.GRATITUDE_SOURCE_DB_URL || process.env.SUPABASE_DATABASE_ADMIN_URL || process.env.SUPABASE_DATABASE_URL;
  const DEST = process.env.VIA65_DB_URL;
  if (!SOURCE || !DEST) {
    console.error('Set GRATITUDE_SOURCE_DB_URL (source) and VIA65_DB_URL (dest) — admin Postgres URLs (postgres.<ref>).');
    process.exit(1);
  }
  console.log('SOURCE →', describe(SOURCE));
  console.log('DEST   →', describe(DEST));
  if (new URL(SOURCE).host === new URL(DEST).host && new URL(SOURCE).username === new URL(DEST).username) {
    console.error('Refusing to run: source and dest look identical.');
    process.exit(1);
  }
  console.log(EXECUTE ? '=== EXECUTE ===' : '=== DRY RUN (pass --execute to write) ===');

  const src = connect(SOURCE);
  const dst = connect(DEST);
  try {
    await src.connect();
    await dst.connect();
    if (!(await tableExists(dst, 'auth', 'users'))) throw new Error('Dest has no auth.users — is VIA65_DB_URL really the Via65 project?');

    await ensureRole(dst);
    if (!SKIP_SCHEMA) await applySchema(dst); else console.log('schema: skipped (--skip-schema)');
    await ensureGrantsAndPolicies(dst);
    if (!SKIP_DATA) await copyData(src, dst); else console.log('data: skipped (--skip-data)');
    if (!SKIP_BACKFILL) await backfillCanonical(dst); else console.log('canonical backfill: skipped (--skip-backfill)');

    if (!EXECUTE) console.log('\nNothing written. Review the plan, run against a Via65 staging copy, then re-run with --execute.');
  } catch (e) {
    console.error('via65-migrate-gratitude failed:', e.message);
    process.exitCode = 1;
  } finally {
    await src.end().catch(() => {});
    await dst.end().catch(() => {});
  }
})();
