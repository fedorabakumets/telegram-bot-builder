-- Добавление полей для Telethon userbot
ALTER TABLE bot_tokens ADD COLUMN IF NOT EXISTS userbot_enabled INTEGER DEFAULT 0;
ALTER TABLE bot_tokens ADD COLUMN IF NOT EXISTS userbot_api_id TEXT;
ALTER TABLE bot_tokens ADD COLUMN IF NOT EXISTS userbot_api_hash TEXT;
ALTER TABLE bot_tokens ADD COLUMN IF NOT EXISTS userbot_session_string TEXT;
