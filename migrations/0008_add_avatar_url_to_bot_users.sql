-- Миграция добавляет поле avatar_url в таблицу bot_users
-- Для хранения URL аватарок пользователей Telegram

ALTER TABLE bot_users 
ADD COLUMN IF NOT EXISTS avatar_url text;
