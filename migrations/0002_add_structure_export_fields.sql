-- Migration: Add structure export metadata fields to bot_projects
-- Created: 2026-02-17
-- Description: Добавляет поля для хранения информации об экспорте структуры проекта

ALTER TABLE "bot_projects" 
ADD COLUMN "last_exported_structure_sheet_id" text,
ADD COLUMN "last_exported_structure_sheet_url" text,
ADD COLUMN "last_exported_structure_at" timestamp;
