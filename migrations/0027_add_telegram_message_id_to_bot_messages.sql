-- @fileoverview Миграция: добавление поля telegram_message_id в таблицу bot_messages
-- Позволяет хранить ID сообщения в Telegram для последующего удаления или редактирования через Telegram API
-- Created: 2026-05-10

ALTER TABLE bot_messages ADD COLUMN IF NOT EXISTS telegram_message_id INTEGER;
