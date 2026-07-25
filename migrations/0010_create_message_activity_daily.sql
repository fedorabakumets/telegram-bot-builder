-- @fileoverview Дневные агрегаты активности сообщений + бэкфилл из bot_messages
--
-- Таблица message_activity_daily хранит immutable-счётчики по дням.
-- Удаление строк из bot_messages (диалоги / будущий retention) не уменьшает эти счётчики.
-- Бэкфилл заполняет историю из текущих сообщений; повторный прогон безопасен (DO NOTHING).

CREATE TABLE IF NOT EXISTS message_activity_daily (
  project_id INTEGER NOT NULL REFERENCES bot_projects(id) ON DELETE CASCADE,
  token_id INTEGER NOT NULL DEFAULT 0,
  day DATE NOT NULL,
  incoming_count INTEGER NOT NULL DEFAULT 0,
  outgoing_count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (project_id, token_id, day)
);

CREATE INDEX IF NOT EXISTS message_activity_daily_project_day_idx
  ON message_activity_daily (project_id, day);

-- Бэкфилл из существующих сообщений (только отсутствующие слоты)
INSERT INTO message_activity_daily (project_id, token_id, day, incoming_count, outgoing_count)
SELECT
  project_id,
  COALESCE(token_id, 0),
  created_at::date,
  COUNT(*) FILTER (WHERE message_type = 'user'),
  COUNT(*) FILTER (WHERE message_type IS DISTINCT FROM 'user')
FROM bot_messages
WHERE created_at IS NOT NULL
GROUP BY 1, 2, 3
ON CONFLICT (project_id, token_id, day) DO NOTHING;
