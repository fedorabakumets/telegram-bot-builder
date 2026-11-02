/** @fileoverview Безопасное чтение ISO-дат ячеек для фильтрации произвольного табличного графика. */
BEGIN;
SELECT pg_advisory_xact_lock(7262401);
/** Невалидные и неоднозначные даты не ломают весь график и не попадают в выбранный период. */
CREATE OR REPLACE FUNCTION analytics_table_timestamp_v2(value text)
RETURNS timestamptz LANGUAGE plpgsql IMMUTABLE SET timezone='UTC' SET search_path=pg_catalog AS $$
BEGIN
  IF value IS NULL OR value !~ '^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}:\d{2}(\.\d{1,6})?(Z|[+-]\d{2}:\d{2})?)?$' THEN RETURN NULL; END IF;
  RETURN value::timestamptz;
EXCEPTION WHEN datetime_field_overflow OR invalid_datetime_format THEN RETURN NULL;
END $$;
COMMENT ON FUNCTION analytics_table_timestamp_v2(text) IS 'ISO-даты без зоны трактуются как UTC; ошибочные ячейки возвращают NULL.';
COMMIT;
