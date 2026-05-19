-- Очистить flight поля
UPDATE bot_table_rows
SET data = data || '{"267": "", "268": "", "269": ""}'::jsonb
WHERE table_id = 31 AND data->>'240' = '1612141295';
