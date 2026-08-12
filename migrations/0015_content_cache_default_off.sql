-- Живое обновление контента по умолчанию выключено (меньше памяти)
ALTER TABLE bot_tokens ALTER COLUMN content_cache SET DEFAULT 0;
