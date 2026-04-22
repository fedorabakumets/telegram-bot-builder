-- Migration: Создание таблицы коллабораторов проекта
-- Created: 2026-05-01
-- Description: Добавляет таблицу для хранения коллабораторов проекта

CREATE TABLE IF NOT EXISTS project_collaborators (
  project_id INTEGER NOT NULL REFERENCES bot_projects(id) ON DELETE CASCADE,
  user_id    BIGINT  NOT NULL REFERENCES telegram_users(id) ON DELETE CASCADE,
  invited_by BIGINT  REFERENCES telegram_users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  PRIMARY KEY (project_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_project_collaborators_user ON project_collaborators(user_id);
