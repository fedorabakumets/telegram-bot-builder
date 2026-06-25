-- @fileoverview Колонка author_kind в таблице project_versions
--
-- Различает автора снимка версии:
--   NULL / 'user' — обычный пользователь (или легитимный null-автор:
--                   авто-снимок проекта без владельца, гость при SKIP_AUTH).
--   'agent'       — снимок создан правкой через MCP-агента (agentEdit=true),
--                   у которого нет сессии и authorId = null. В истории версий
--                   для таких записей отображается автор «ИИ-агент».
--
-- Идемпотентна: ADD COLUMN IF NOT EXISTS, безопасно запускать повторно.
-- Колонка nullable и без DEFAULT — NULL означает обычного автора/пользователя.

ALTER TABLE project_versions ADD COLUMN IF NOT EXISTS author_kind TEXT;
