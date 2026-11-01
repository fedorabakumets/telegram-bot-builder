-- Настройки столбцов не меняют идентификаторы, имена и значения существующих ячеек.
ALTER TABLE bot_table_columns ADD COLUMN IF NOT EXISTS settings JSONB NOT NULL DEFAULT '{}'::jsonb;
