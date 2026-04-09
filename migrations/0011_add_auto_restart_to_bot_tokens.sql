-- Добавляет поля автоперезапуска в bot_tokens
ALTER TABLE bot_tokens
ADD COLUMN IF NOT EXISTS auto_restart integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_restart_attempts integer DEFAULT 3;
