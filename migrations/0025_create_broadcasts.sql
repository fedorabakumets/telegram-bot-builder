-- @fileoverview Миграция: создание таблиц рассылок
-- Добавляет broadcasts (задания на массовую отправку) и broadcast_results (результаты по каждому получателю)
-- Created: 2026-05-09

CREATE TABLE IF NOT EXISTS broadcasts (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES bot_projects(id) ON DELETE CASCADE,
  token_id INTEGER NOT NULL DEFAULT 0,
  name TEXT NOT NULL,
  message_text TEXT NOT NULL,
  filters JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  total_count INTEGER NOT NULL DEFAULT 0,
  sent_count INTEGER NOT NULL DEFAULT 0,
  delivered_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_broadcasts_project_token ON broadcasts(project_id, token_id);
CREATE INDEX IF NOT EXISTS idx_broadcasts_status ON broadcasts(status);

CREATE TABLE IF NOT EXISTS broadcast_results (
  id SERIAL PRIMARY KEY,
  broadcast_id INTEGER NOT NULL REFERENCES broadcasts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  status TEXT NOT NULL,
  error_message TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_broadcast_results_broadcast_id ON broadcast_results(broadcast_id);
CREATE INDEX IF NOT EXISTS idx_broadcast_results_status ON broadcast_results(broadcast_id, status);
