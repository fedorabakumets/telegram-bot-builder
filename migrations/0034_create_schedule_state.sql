-- Migration: Создание таблицы состояния schedule-задач
-- Created: 2026-05-17
-- Description: Добавляет таблицу для персистентности фоновых schedule_trigger задач (расписание)

CREATE TABLE IF NOT EXISTS schedule_state (
  id              SERIAL PRIMARY KEY,
  project_id      INTEGER NOT NULL,
  token_id        INTEGER NOT NULL,
  node_id         VARCHAR(255) NOT NULL,
  last_run_at     TIMESTAMP WITH TIME ZONE,
  next_run_at     TIMESTAMP WITH TIME ZONE,
  run_count       INTEGER NOT NULL DEFAULT 0,
  last_duration_ms INTEGER,
  last_error      TEXT,
  last_status     VARCHAR(20) NOT NULL DEFAULT 'idle',
  enabled         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(project_id, token_id, node_id)
);

-- Индекс для поиска задач по проекту и токену
CREATE INDEX IF NOT EXISTS idx_schedule_state_project_token ON schedule_state(project_id, token_id);

-- Индекс для получения активных задач
CREATE INDEX IF NOT EXISTS idx_schedule_state_enabled ON schedule_state(enabled) WHERE enabled = TRUE;

-- Индекс для поиска задач по статусу (мониторинг)
CREATE INDEX IF NOT EXISTS idx_schedule_state_status ON schedule_state(last_status);
