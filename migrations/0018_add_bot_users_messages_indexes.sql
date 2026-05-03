-- Индексы для ускорения запросов к bot_users и bot_messages
-- Устраняет медленные full scan при фильтрации по project_id / token_id

CREATE INDEX IF NOT EXISTS idx_bot_users_project_token
  ON bot_users (project_id, token_id);

CREATE INDEX IF NOT EXISTS idx_bot_users_project_token_active
  ON bot_users (project_id, token_id, is_active);

CREATE INDEX IF NOT EXISTS idx_bot_messages_project_token_user
  ON bot_messages (project_id, token_id, user_id);

CREATE INDEX IF NOT EXISTS idx_bot_messages_user_project
  ON bot_messages (user_id, project_id, token_id);
