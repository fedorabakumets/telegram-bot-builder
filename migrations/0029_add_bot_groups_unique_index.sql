-- Уникальный индекс по (project_id, group_id) в таблице bot_groups.
-- Необходим для ON CONFLICT при авто-регистрации групп из middleware бота.
CREATE UNIQUE INDEX IF NOT EXISTS bot_groups_project_group_uniq
ON bot_groups (project_id, group_id)
WHERE group_id IS NOT NULL;
