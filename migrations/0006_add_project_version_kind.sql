-- @fileoverview Колонка kind в таблице project_versions
--
-- Различает авто-снимки (создаются автоматически при сохранении проекта)
-- и ручные коммиты-чекпоинты (создаются вручную пользователем с сообщением).
--
-- kind = 'auto'   — авто-снимок, попадает под лимит хранения (pruneProjectVersions).
-- kind = 'manual' — ручной коммит, НЕ удаляется при очистке лишних авто-снимков.
--
-- Идемпотентна: ADD COLUMN IF NOT EXISTS, безопасно запускать повторно.

ALTER TABLE project_versions ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'auto';
