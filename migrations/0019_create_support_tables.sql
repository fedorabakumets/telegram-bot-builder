-- Чат поддержки платформы: один диалог на пользователя и его сообщения

CREATE TABLE IF NOT EXISTS support_threads (
  id SERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL UNIQUE REFERENCES telegram_users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'open',
  unread_by_admin INTEGER NOT NULL DEFAULT 0,
  unread_by_user INTEGER NOT NULL DEFAULT 0,
  telegram_topic_id INTEGER,
  last_message_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS support_threads_last_message_idx
  ON support_threads (last_message_at);

CREATE TABLE IF NOT EXISTS support_messages (
  id SERIAL PRIMARY KEY,
  thread_id INTEGER NOT NULL REFERENCES support_threads(id) ON DELETE CASCADE,
  sender TEXT NOT NULL,
  text TEXT NOT NULL,
  context JSONB,
  source TEXT NOT NULL DEFAULT 'web',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS support_messages_thread_idx
  ON support_messages (thread_id, id);
