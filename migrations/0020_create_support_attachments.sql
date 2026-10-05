-- Картинки сообщений чата поддержки. Файл лежит в активном хранилище, не в media_files.
CREATE TABLE IF NOT EXISTS support_attachments (
  id SERIAL PRIMARY KEY,
  message_id INTEGER NOT NULL REFERENCES support_messages(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  mime TEXT NOT NULL,
  size INTEGER NOT NULL,
  storage_config_id TEXT NOT NULL,
  storage_key TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS support_attachments_message_idx
  ON support_attachments (message_id);
