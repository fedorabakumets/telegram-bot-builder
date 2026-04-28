-- Миграция: заполнение owner_id в bot_tokens из bot_projects
-- Исправляет старые записи где owner_id = NULL, хотя проект имеет владельца.
-- Безопасно запускать повторно — обновляет только NULL-записи.

UPDATE bot_tokens t
SET owner_id = p.owner_id
FROM bot_projects p
WHERE t.project_id = p.id
  AND t.owner_id IS NULL
  AND p.owner_id IS NOT NULL;
