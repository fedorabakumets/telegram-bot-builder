-- Миграция добавляет поле is_bot в таблицу bot_users
-- Для различения ботов и обычных пользователей

ALTER TABLE bot_users 
ADD COLUMN IF NOT EXISTS is_bot integer DEFAULT 0;
