-- Optional good-vibes icon chosen while composing a gratitude.
ALTER TABLE gratitude.posts ADD COLUMN IF NOT EXISTS vibe TEXT;
