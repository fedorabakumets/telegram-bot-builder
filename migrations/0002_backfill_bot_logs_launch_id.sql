-- @fileoverview Backfill launch_id в bot_logs для всех проектов и токенов
--
-- Привязывает строки логов без launch_id к записи bot_launch_history
-- по временному окну [started_at, ended_at) внутри каждого token_id.
-- ended_at = stopped_at, иначе начало следующего запуска, иначе бесконечность.
--
-- Идемпотентна: обновляет только строки с launch_id IS NULL.
-- Безопасно запускать повторно при каждом старте приложения.

DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  WITH launches AS (
    SELECT
      id,
      token_id,
      started_at,
      COALESCE(
        stopped_at,
        LEAD(started_at) OVER (PARTITION BY token_id ORDER BY started_at),
        TIMESTAMP 'infinity'
      ) AS ended_at
    FROM bot_launch_history
  )
  UPDATE bot_logs bl
  SET launch_id = l.id
  FROM launches l
  WHERE bl.token_id = l.token_id
    AND bl.launch_id IS NULL
    AND bl.timestamp >= l.started_at
    AND bl.timestamp < l.ended_at;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'backfill_bot_logs_launch_id: обновлено % строк', updated_count;
END $$;
