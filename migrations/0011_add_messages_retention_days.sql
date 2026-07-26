-- @fileoverview Срок хранения сообщений диалога на токене бота
--
-- messages_retention_days: 0 = без автоочистки; N > 0 = удалять bot_messages
-- этого токена старше N дней. message_activity_daily не затрагивается.

ALTER TABLE bot_tokens
  ADD COLUMN IF NOT EXISTS messages_retention_days INTEGER NOT NULL DEFAULT 0;
