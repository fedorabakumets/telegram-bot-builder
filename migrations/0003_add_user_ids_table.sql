-- Migration: Add user_ids table for broadcast functionality
-- Created: 2026-02-20
-- Description: Создает таблицу для хранения ID пользователей рассылки

CREATE TABLE IF NOT EXISTS "user_ids" (
  "id" serial PRIMARY KEY,
  "project_id" integer NOT NULL,
  "user_id" bigint NOT NULL,
  "created_at" timestamp DEFAULT NOW(),
  CONSTRAINT "user_ids_project_id_user_id_unique" UNIQUE ("project_id", "user_id")
);

ALTER TABLE "user_ids"
ADD CONSTRAINT "user_ids_project_id_fk" 
FOREIGN KEY ("project_id") REFERENCES "bot_projects"("id") ON DELETE CASCADE;

-- Index for faster lookups by project_id
CREATE INDEX IF NOT EXISTS "user_ids_project_id_idx" ON "user_ids"("project_id");

-- Index for faster lookups by user_id
CREATE INDEX IF NOT EXISTS "user_ids_user_id_idx" ON "user_ids"("user_id");
