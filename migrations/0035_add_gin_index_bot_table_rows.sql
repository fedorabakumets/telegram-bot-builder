-- GIN индекс на bot_table_rows.data для быстрого поиска по JSONB
-- Ускоряет операции read/update в нодах bot_table (WHERE data->>'key' = 'value')

CREATE INDEX IF NOT EXISTS idx_bot_table_rows_data
  ON bot_table_rows USING gin(data);

-- B-tree индекс на table_id для быстрой фильтрации строк по таблице
CREATE INDEX IF NOT EXISTS idx_bot_table_rows_table_id
  ON bot_table_rows (table_id);
