-- Пометки недоступности пользователей и отдельные счётчики рассылки
-- is_blocked: временно заблокировал бота (снимается при новом сообщении)
-- is_deleted: аккаунт удалён/деактивирован (в рассылки не берём)

ALTER TABLE bot_users
  ADD COLUMN IF NOT EXISTS is_blocked INTEGER NOT NULL DEFAULT 0;

ALTER TABLE bot_users
  ADD COLUMN IF NOT EXISTS is_deleted INTEGER NOT NULL DEFAULT 0;

ALTER TABLE broadcasts
  ADD COLUMN IF NOT EXISTS blocked_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE broadcasts
  ADD COLUMN IF NOT EXISTS deleted_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE broadcast_campaigns
  ADD COLUMN IF NOT EXISTS blocked_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE broadcast_campaigns
  ADD COLUMN IF NOT EXISTS deleted_count INTEGER NOT NULL DEFAULT 0;
