-- Миграция добавляет поле avatar_url в таблицу user_bot_data
-- Для хранения URL аватарок пользователей Telegram

ALTER TABLE user_bot_data 
ADD COLUMN IF NOT EXISTS avatar_url text;
