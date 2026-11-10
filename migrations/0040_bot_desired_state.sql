/** @fileoverview Отделяет желаемое состояние бота от фактического без изменения старых записей. */
ALTER TABLE bot_instances ADD COLUMN IF NOT EXISTS desired_status TEXT;
ALTER TABLE bot_instances ADD COLUMN IF NOT EXISTS desired_generation INTEGER NOT NULL DEFAULT 0;
ALTER TABLE bot_instances ADD COLUMN IF NOT EXISTS desired_updated_at TIMESTAMP;
/** Существующие запущенные боты сохраняют намерение после первого раздельного запуска. */
UPDATE bot_instances SET desired_status = CASE WHEN status = 'running' THEN 'running' ELSE 'stopped' END
WHERE desired_status IS NULL;
