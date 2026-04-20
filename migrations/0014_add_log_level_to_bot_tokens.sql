-- Migration: Add log_level column to bot_tokens table
-- Created: 2026-04-20
-- Description: Добавляет столбец log_level для хранения уровня логирования Python-бота

ALTER TABLE "bot_tokens" ADD COLUMN "log_level" text DEFAULT 'WARNING';
