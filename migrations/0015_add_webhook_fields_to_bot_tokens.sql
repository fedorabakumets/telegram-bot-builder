-- Migration: Add webhook fields to bot_tokens table
-- Created: 2026-04-21
-- Description: Добавляет поля для webhook режима запуска бота

ALTER TABLE "bot_tokens" ADD COLUMN IF NOT EXISTS "launch_mode" text DEFAULT 'polling';
ALTER TABLE "bot_tokens" ADD COLUMN IF NOT EXISTS "webhook_base_url" text;
ALTER TABLE "bot_tokens" ADD COLUMN IF NOT EXISTS "webhook_secret_token" text;
