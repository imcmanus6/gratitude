-- Partner API keys (e.g. Briefly) minted by the embedded /connect flow.
CREATE TABLE IF NOT EXISTS gratitude.api_keys (
  hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES gratitude.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created BIGINT NOT NULL,
  last_used BIGINT
);
CREATE INDEX IF NOT EXISTS api_keys_user_idx ON gratitude.api_keys(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON gratitude.api_keys TO gratitude_app;
