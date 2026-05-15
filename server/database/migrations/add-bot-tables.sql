-- Миграция: создание таблиц для пользовательских таблиц проекта (Bot Tables)

-- Таблица определений пользовательских таблиц
CREATE TABLE IF NOT EXISTS bot_tables (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES bot_projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bot_tables_project_id ON bot_tables(project_id);

-- Таблица колонок пользовательских таблиц
CREATE TABLE IF NOT EXISTS bot_table_columns (
  id SERIAL PRIMARY KEY,
  table_id INTEGER NOT NULL REFERENCES bot_tables(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  position INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_bot_table_columns_table_id ON bot_table_columns(table_id);

-- Таблица строк пользовательских таблиц (данные в JSONB)
CREATE TABLE IF NOT EXISTS bot_table_rows (
  id SERIAL PRIMARY KEY,
  table_id INTEGER NOT NULL REFERENCES bot_tables(id) ON DELETE CASCADE,
  row_index INTEGER NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_bot_table_rows_table_id ON bot_table_rows(table_id);
