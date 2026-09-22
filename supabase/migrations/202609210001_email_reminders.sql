CREATE TABLE IF NOT EXISTS gratitude.email_reminders (
  user_id TEXT PRIMARY KEY REFERENCES gratitude.users(id) ON DELETE CASCADE,
  timezone TEXT NOT NULL,
  time TEXT NOT NULL DEFAULT '21:00',
  last_day TEXT,
  lease BIGINT NOT NULL DEFAULT 0
);
ALTER TABLE gratitude.email_reminders ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON gratitude.email_reminders FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON gratitude.email_reminders TO gratitude_app;
CREATE POLICY server_access ON gratitude.email_reminders
  TO gratitude_app USING (true) WITH CHECK (true);
ALTER TABLE gratitude.push_subscriptions ADD COLUMN IF NOT EXISTS time TEXT NOT NULL DEFAULT '21:00';
