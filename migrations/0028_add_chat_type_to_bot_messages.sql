-- @fileoverview Миграция: добавление поля chat_type в таблицу bot_messages
-- Позволяет различать личные сообщения ('private') и сообщения из групп ('group', 'supergroup', 'channel')
-- Необходимо для отображения групповых диалогов в панели диалогов
-- Created: 2026-05-12

ALTER TABLE bot_messages ADD COLUMN IF NOT EXISTS chat_type TEXT DEFAULT 'private';
ALTER TABLE bot_messages ADD COLUMN IF NOT EXISTS chat_id TEXT;
