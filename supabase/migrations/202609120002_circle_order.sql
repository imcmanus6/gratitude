-- Preserve the SQLite insertion order used by the circle menu.
ALTER TABLE gratitude.circles ADD COLUMN rowid bigint GENERATED ALWAYS AS IDENTITY;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA gratitude TO gratitude_app;
