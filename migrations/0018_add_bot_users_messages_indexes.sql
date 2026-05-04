-- Индексы для ускорения запросов к bot_users и bot_messages
-- bot_users columns: user_id (PK), username, is_active, last_interaction
-- bot_messages columns: project_id, user_id

CREATE INDEX IF NOT EXISTS idx_bot_users_is_active
  ON bot_users (is_active);

CREATE INDEX IF NOT EXISTS idx_bot_users_last_interaction
  ON bot_users (last_interaction);

CREATE INDEX IF NOT EXISTS idx_bot_messages_project_id
  ON bot_messages (project_id);

CREATE INDEX IF NOT EXISTS idx_bot_messages_user_project
  ON bot_messages (user_id, project_id);
