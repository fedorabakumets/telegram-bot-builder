-- Сборки ботов: метаданные сгенерированного кода, сам код лежит в хранилище (local/S3)

CREATE TABLE IF NOT EXISTS bot_builds (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES bot_projects(id) ON DELETE CASCADE,
  token_id INTEGER NOT NULL REFERENCES bot_tokens(id) ON DELETE CASCADE,
  fingerprint TEXT NOT NULL,
  storage_config_id TEXT NOT NULL,
  object_key TEXT NOT NULL,
  file_name TEXT NOT NULL,
  size INTEGER NOT NULL,
  sha256 TEXT NOT NULL,
  generator_version TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_bot_builds_token_fingerprint
  ON bot_builds(token_id, fingerprint);

CREATE INDEX IF NOT EXISTS idx_bot_builds_token_created
  ON bot_builds(token_id, created_at);
