/** @fileoverview Проектные значения настроек поведения и данных и их наследование. */
ALTER TABLE bot_projects
  ADD COLUMN IF NOT EXISTS bot_setting_defaults JSONB NOT NULL DEFAULT '{}'::jsonb
    CHECK (jsonb_typeof(bot_setting_defaults) = 'object');

/** Ранее добавленные боты сохраняют все индивидуальные значения. */
ALTER TABLE bot_tokens
  ADD COLUMN IF NOT EXISTS inherit_bot_settings JSONB NOT NULL DEFAULT '[]'::jsonb
    CHECK (jsonb_typeof(inherit_bot_settings) = 'array');

/** Новые записи по умолчанию наследуют все общие настройки. */
ALTER TABLE bot_tokens
  ALTER COLUMN inherit_bot_settings SET DEFAULT
    '["saveIncomingMedia","messagesRetentionDays","contentCache","logLevel","catchAllHandlers","trackUserBlocks","trackGroupMembership","protectContent","webhookBaseUrl"]'::jsonb;
