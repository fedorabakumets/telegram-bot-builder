/** @fileoverview Общие настройки жизни обработчика и автоперезапуска, наследуемые ботами. */
ALTER TABLE bot_projects
  ADD COLUMN IF NOT EXISTS default_sleep_mode TEXT CHECK (default_sleep_mode IN ('direct', 'process')),
  ADD COLUMN IF NOT EXISTS default_auto_restart INTEGER NOT NULL DEFAULT 0 CHECK (default_auto_restart IN (0, 1)),
  ADD COLUMN IF NOT EXISTS default_max_restart_attempts INTEGER NOT NULL DEFAULT 3
    CHECK (default_max_restart_attempts BETWEEN 1 AND 10);

/** Существующие боты сохраняют свои настройки. */
ALTER TABLE bot_tokens
  ADD COLUMN IF NOT EXISTS inherit_sleep_mode BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS inherit_auto_restart BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS inherit_max_restart_attempts BOOLEAN NOT NULL DEFAULT false;

/** Новые боты используют общие настройки при отсутствии явных переопределений. */
ALTER TABLE bot_tokens
  ALTER COLUMN inherit_sleep_mode SET DEFAULT true,
  ALTER COLUMN inherit_auto_restart SET DEFAULT true,
  ALTER COLUMN inherit_max_restart_attempts SET DEFAULT true;
