-- Migration: Создание таблицы процессов воркеров
-- Created: 2026-05-16
-- Description: Добавляет таблицу для мониторинга Python worker процессов (Worker Pool)

CREATE TABLE IF NOT EXISTS worker_processes (
  id          SERIAL PRIMARY KEY,
  project_id  INTEGER NOT NULL,
  pid         INTEGER,
  status      TEXT NOT NULL DEFAULT 'running',
  bots_count  INTEGER NOT NULL DEFAULT 0,
  memory_mb   INTEGER,
  started_at  TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  stopped_at  TIMESTAMP WITHOUT TIME ZONE
);

-- Индекс для поиска воркера по проекту
CREATE INDEX IF NOT EXISTS idx_worker_processes_project_id ON worker_processes(project_id);

-- Индекс для получения активных воркеров
CREATE INDEX IF NOT EXISTS idx_worker_processes_status ON worker_processes(status);
