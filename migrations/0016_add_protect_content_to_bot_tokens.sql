-- Migration: Add protect_content setting to bot_tokens
ALTER TABLE "bot_tokens"
ADD COLUMN IF NOT EXISTS "protect_content" integer DEFAULT 0;
