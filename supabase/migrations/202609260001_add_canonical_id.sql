-- Ecosystem shared identity: link each Gratitude user to the canonical identity
-- (Supabase Auth `sub`) shared across the app ecosystem (Briefly, Meditation,
-- Daily Habits). Nullable + backfilled during federation; unique when present so
-- two Gratitude users can't map to the same canonical person. Additive — the
-- existing hand-rolled auth keeps working until the Supabase-Auth cutover.
ALTER TABLE users ADD COLUMN IF NOT EXISTS canonical_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS users_canonical_id_key
  ON users (canonical_id) WHERE canonical_id IS NOT NULL;
