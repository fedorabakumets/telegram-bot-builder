-- Migration: Migrate Telegram settings to global (default user)
-- Created: 2026-02-21
-- Description: Переносит настройки Telegram Client API на общую базу

-- Обновляем все записи на 'default' userId
UPDATE user_telegram_settings
SET user_id = 'default',
    updated_at = NOW()
WHERE user_id != 'default';

-- Если есть несколько записей, оставляем только последнюю активную
DELETE FROM user_telegram_settings a
USING user_telegram_settings b
WHERE a.id < b.id
  AND a.user_id = 'default';
