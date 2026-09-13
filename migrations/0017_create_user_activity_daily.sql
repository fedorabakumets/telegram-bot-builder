-- @fileoverview Дневные отметки активности пользователей + бэкфилл из bot_messages
--
-- Таблица user_activity_daily хранит «этот человек был активен в этот день».
-- Удаление строк из bot_messages / bot_users не уменьшает историю графика.
-- first_seen_at — копия времени первого появления (registered_at), чтобы
-- разделение на новичков/вернувшихся не зависело от судьбы записи в bot_users.
-- Бэкфилл заполняет историю; повторный прогон безопасен (DO NOTHING).

CREATE TABLE IF NOT EXISTS user_activity_daily (
  project_id INTEGER NOT NULL REFERENCES bot_projects(id) ON DELETE CASCADE,
  token_id INTEGER NOT NULL DEFAULT 0,
  day DATE NOT NULL,
  user_id BIGINT NOT NULL,
  first_seen_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (project_id, token_id, day, user_id)
);

CREATE INDEX IF NOT EXISTS user_activity_daily_project_day_idx
  ON user_activity_daily (project_id, day);

-- Бэкфилл: один человек × день из входящих сообщений
INSERT INTO user_activity_daily (project_id, token_id, day, user_id, first_seen_at)
SELECT
  bm.project_id,
  COALESCE(bm.token_id, 0),
  bm.created_at::date,
  bm.user_id::bigint,
  COALESCE(
    bu.registered_at,
    MIN(bm.created_at)
  )
FROM bot_messages bm
LEFT JOIN bot_users bu
  ON bu.project_id = bm.project_id
 AND bu.token_id = COALESCE(bm.token_id, 0)
 AND bu.user_id = bm.user_id::bigint
WHERE bm.created_at IS NOT NULL
  AND bm.message_type = 'user'
  AND bm.user_id ~ '^[0-9]+$'
GROUP BY 1, 2, 3, 4, bu.registered_at
ON CONFLICT (project_id, token_id, day, user_id) DO NOTHING;
