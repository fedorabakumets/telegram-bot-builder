-- Добавляет колонку session_id в таблицу bot_projects
-- для изоляции гостевых проектов по сессии пользователя.
-- Существующие проекты с owner_id = NULL получат session_id = NULL
-- и останутся видимыми для всех (обратная совместимость).
ALTER TABLE bot_projects ADD COLUMN session_id TEXT;
