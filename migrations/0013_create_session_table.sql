-- Migration: Create session table for connect-pg-simple
-- Created: 2026-02-22
-- Description: Создаёт таблицу session для хранения HTTP-сессий (connect-pg-simple)

CREATE TABLE IF NOT EXISTS "session" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL,
  CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
);
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
