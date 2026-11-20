/** @fileoverview Настройка способа получения обновлений проекта и её наследование ботами. */
ALTER TABLE bot_projects
  ADD COLUMN IF NOT EXISTS default_launch_mode TEXT NOT NULL DEFAULT 'polling'
    CHECK (default_launch_mode IN ('polling', 'webhook'));

/** Существующие боты сохраняют индивидуальную настройку. */
ALTER TABLE bot_tokens
  ADD COLUMN IF NOT EXISTS inherit_launch_mode BOOLEAN NOT NULL DEFAULT false;

/** Новые боты наследуют настройку проекта, если при создании не задано иное. */
ALTER TABLE bot_tokens
  ALTER COLUMN inherit_launch_mode SET DEFAULT true;

/** Хранит способ получения обновлений отдельно от настройки следующего запуска. */
ALTER TABLE bot_instances
  ADD COLUMN IF NOT EXISTS launch_mode TEXT
    CHECK (launch_mode IN ('polling', 'webhook'));

/** Фиксирует прежнюю настройку живых экземпляров, оставляя остановленные пустыми. */
UPDATE bot_instances AS instance
SET launch_mode = CASE WHEN token.launch_mode = 'webhook' THEN 'webhook' ELSE 'polling' END
FROM bot_tokens AS token
WHERE instance.token_id = token.id
  AND instance.status IN ('running', 'starting')
  AND instance.launch_mode IS NULL;
