/** @fileoverview Ограниченный повтор загрузки сборки по поколению намерения бота. */
ALTER TABLE bot_instances
  ADD COLUMN IF NOT EXISTS build_retry_generation integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS build_retry_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS build_retry_after timestamp;
