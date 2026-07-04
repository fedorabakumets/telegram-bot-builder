-- @fileoverview Редизайн файлового хранилища: реестр хранилищ, file_id по токенам, новые поля media_files
--
-- storage_configs — реестр конфигураций хранилищ (несколько S3 и локальных папок).
--   Одно хранилище активно для новых загрузок (is_active); читать можно из всех.
--   Секреты S3 (access/secret key) хранятся зашифрованными в secrets_enc, наружу не отдаются.
-- media_file_tokens — денормализация fileIdsByToken: Telegram file_id отдельно для каждой
--   пары (медиафайл, токен бота). Уникальность пары гарантирует один file_id на бота.
-- media_files — новые поля: uploaded_by (кто загрузил), storage_backend ("local"|"s3"),
--   storage_config_id (FK на реестр хранилищ), file_unique_id (Telegram file_unique_id для дедупликации).
--
-- Порядок: сначала storage_configs (на неё ссылается media_files.storage_config_id),
-- затем поля media_files, затем media_file_tokens (ссылается на media_files и bot_tokens).
--
-- Идемпотентна: IF NOT EXISTS на таблицах/колонках/индексах, безопасно запускать повторно.

-- Реестр хранилищ (Requirements 10.1, 10.2)
CREATE TABLE IF NOT EXISTS storage_configs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  backend TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  config JSONB NOT NULL,
  secrets_enc TEXT,
  read_only BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Новые поля media_files (Requirements 9.1, 10.2)
ALTER TABLE media_files ADD COLUMN IF NOT EXISTS uploaded_by BIGINT REFERENCES telegram_users(id) ON DELETE SET NULL;
ALTER TABLE media_files ADD COLUMN IF NOT EXISTS storage_backend TEXT NOT NULL DEFAULT 'local';
ALTER TABLE media_files ADD COLUMN IF NOT EXISTS storage_config_id TEXT REFERENCES storage_configs(id) ON DELETE SET NULL;
ALTER TABLE media_files ADD COLUMN IF NOT EXISTS file_unique_id TEXT;

-- file_id медиафайлов по токенам ботов (Requirements 8.1)
CREATE TABLE IF NOT EXISTS media_file_tokens (
  id SERIAL PRIMARY KEY,
  media_file_id INTEGER NOT NULL REFERENCES media_files(id) ON DELETE CASCADE,
  token_id INTEGER NOT NULL REFERENCES bot_tokens(id) ON DELETE CASCADE,
  file_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS media_file_tokens_media_token_unique ON media_file_tokens(media_file_id, token_id);
