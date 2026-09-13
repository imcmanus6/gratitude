-- Partner API keys + one-time connect codes (Briefly "Connect" flow).
-- Run with the admin connection after 202609120002. Idempotent.
SET search_path TO gratitude;
CREATE TABLE IF NOT EXISTS api_keys (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, name TEXT, key_prefix TEXT NOT NULL, key_hash TEXT UNIQUE NOT NULL, created TEXT NOT NULL, last_used TEXT, revoked TEXT);
CREATE TABLE IF NOT EXISTS connect_codes (code_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL, client TEXT NOT NULL, redirect_uri TEXT NOT NULL, expires BIGINT NOT NULL);
ALTER TABLE api_keys ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE connect_codes ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS api_keys_user_idx ON api_keys(user_id);
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON api_keys FROM PUBLIC, anon, authenticated;
ALTER TABLE connect_codes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON connect_codes FROM PUBLIC, anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON api_keys, connect_codes TO gratitude_app;
CREATE POLICY server_access ON api_keys TO gratitude_app USING (true) WITH CHECK (true);
CREATE POLICY server_access ON connect_codes TO gratitude_app USING (true) WITH CHECK (true);
