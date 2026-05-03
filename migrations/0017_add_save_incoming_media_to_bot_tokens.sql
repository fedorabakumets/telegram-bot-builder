-- Migration: Add save_incoming_media setting to bot_tokens
ALTER TABLE "bot_tokens"
ADD COLUMN IF NOT EXISTS "save_incoming_media" integer DEFAULT 0;
