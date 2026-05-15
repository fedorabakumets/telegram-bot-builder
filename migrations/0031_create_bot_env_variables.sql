-- Migration: Создание таблицы пользовательских переменных окружения бота
-- Created: 2026-05-15
-- Description: Добавляет таблицу для хранения кастомных env-переменных, привязанных к токену бота

CREATE TABLE IF NOT EXISTS bot_env_variables (
  id         SERIAL PRIMARY KEY,
  token_id   INTEGER NOT NULL REFERENCES bot_tokens(id) ON DELETE CASCADE,
  key        TEXT NOT NULL,
  value      TEXT NOT NULL DEFAULT '',
  is_secret  INTEGER DEFAULT 0,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- Уникальный индекс: один ключ на один токен
CREATE UNIQUE INDEX IF NOT EXISTS idx_bot_env_variables_token_key ON bot_env_variables(token_id, key);

-- Индекс для быстрого получения всех переменных токена
CREATE INDEX IF NOT EXISTS idx_bot_env_variables_token_id ON bot_env_variables(token_id);
