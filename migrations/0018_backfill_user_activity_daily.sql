-- @fileoverview Повторный бэкфилл user_activity_daily из bot_messages
--
-- Закрывает дыры в графике «Активные пользователи»: если бот не писал
-- дневные отметки (или запись сломалась), слоты восстанавливаются из
-- входящих сообщений. Безопасно на любом деплое — ON CONFLICT DO NOTHING.
-- Существующие строки не меняются.

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
