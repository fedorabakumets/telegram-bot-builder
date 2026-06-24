-- @fileoverview Таблица истории версий проекта (снимки project.json)
--
-- Хранит снимки данных проекта при каждом сохранении для возможности отката
-- (аналог Workflow history в n8n). Снимок — это поле data проекта (BotDataWithSheets) в jsonb.
--
-- project_id — ссылка на bot_projects с каскадным удалением: версии удаляются вместе с проектом.
-- author_id — кто сохранил версию (ссылка на telegram_users), при удалении пользователя обнуляется.
-- Лимит хранения (последние N версий) поддерживается на уровне приложения (pruneProjectVersions).
--
-- Идемпотентна: IF NOT EXISTS, безопасно запускать повторно.

CREATE TABLE IF NOT EXISTS project_versions (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES bot_projects(id) ON DELETE CASCADE,
  snapshot JSONB NOT NULL,
  label TEXT,
  author_id BIGINT REFERENCES telegram_users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_versions_project ON project_versions(project_id);
