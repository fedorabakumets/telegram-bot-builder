-- @fileoverview Привязка bot_groups к токену бота (мультибот-рассылка в группы)
--
-- Добавляет token_id, бэкфиллит из bot_messages, меняет unique на
-- (project_id, token_id, group_id).

ALTER TABLE bot_groups
  ADD COLUMN IF NOT EXISTS token_id INTEGER REFERENCES bot_tokens(id) ON DELETE CASCADE;

DROP INDEX IF EXISTS bot_groups_project_group_uniq;

-- Проставить token_id существующим строкам по последнему сообщению из чата
UPDATE bot_groups bg
SET token_id = sub.token_id
FROM (
  SELECT DISTINCT ON (project_id, chat_id)
    project_id,
    chat_id,
    token_id
  FROM bot_messages
  WHERE chat_type IN ('group', 'supergroup', 'channel')
    AND chat_id IS NOT NULL
    AND token_id IS NOT NULL
    AND token_id > 0
  ORDER BY project_id, chat_id, created_at DESC
) sub
WHERE bg.project_id = sub.project_id
  AND bg.group_id = sub.chat_id
  AND bg.token_id IS NULL;

-- Дозаполнить справочник: пары (token, chat), которых ещё нет в bot_groups
INSERT INTO bot_groups (project_id, token_id, group_id, name, url, chat_type, is_active)
SELECT DISTINCT ON (bm.project_id, bm.token_id, bm.chat_id)
  bm.project_id,
  bm.token_id,
  bm.chat_id,
  COALESCE(
    (SELECT bg2.name FROM bot_groups bg2
     WHERE bg2.project_id = bm.project_id AND bg2.group_id = bm.chat_id
     ORDER BY bg2.id LIMIT 1),
    bm.chat_id
  ),
  '',
  COALESCE(bm.chat_type, 'group'),
  1
FROM bot_messages bm
WHERE bm.chat_type IN ('group', 'supergroup', 'channel')
  AND bm.chat_id IS NOT NULL
  AND bm.token_id IS NOT NULL
  AND bm.token_id > 0
  AND NOT EXISTS (
    SELECT 1 FROM bot_groups bg
    WHERE bg.project_id = bm.project_id
      AND bg.token_id = bm.token_id
      AND bg.group_id = bm.chat_id
  )
ORDER BY bm.project_id, bm.token_id, bm.chat_id, bm.created_at DESC;

CREATE UNIQUE INDEX IF NOT EXISTS bot_groups_project_token_group_uniq
  ON bot_groups (project_id, token_id, group_id)
  WHERE group_id IS NOT NULL AND token_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS bot_groups_project_token_idx
  ON bot_groups (project_id, token_id);
