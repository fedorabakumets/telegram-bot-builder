-- Migration: Add Google Sheet export metadata fields to bot_projects
-- Created: 2026-02-17
-- Description: Добавляет поля для хранения информации о последнем экспорте в Google Таблицы

ALTER TABLE "bot_projects"
ADD COLUMN IF NOT EXISTS "last_exported_google_sheet_id" text,
ADD COLUMN IF NOT EXISTS "last_exported_google_sheet_url" text,
ADD COLUMN IF NOT EXISTS "last_exported_at" timestamp;
