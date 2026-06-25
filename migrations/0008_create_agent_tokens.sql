-- @fileoverview Таблица персональных токенов агента (PAT) для внешних клиентов (MCP/CLI)
--
-- Хранит токены доступа к API от имени владельца. Сам секрет НЕ хранится —
-- только его sha-256 хеш (стандарт GitHub/Stripe; для 256-битного случайного
-- токена соль/bcrypt не нужны). Токен несёт личность владельца, поэтому внешний
-- клиент (MCP-сервер) работает только со своими проектами (модель Figma PAT / n8n).
--
-- owner_id — ссылка на telegram_users с каскадным удалением: токены удаляются вместе с владельцем.
-- token_hash — уникальный индекс: гарантирует уникальность и ускоряет резолв при аутентификации.
-- scopes — права токена (по умолчанию read,write); задел под разграничение прав в будущем.
--
-- Идемпотентна: IF NOT EXISTS, безопасно запускать повторно.

CREATE TABLE IF NOT EXISTS agent_tokens (
  id SERIAL PRIMARY KEY,
  owner_id BIGINT NOT NULL REFERENCES telegram_users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  prefix TEXT NOT NULL,
  scopes TEXT NOT NULL DEFAULT 'read,write',
  created_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP,
  expires_at TIMESTAMP,
  revoked_at TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS agent_tokens_token_hash_idx ON agent_tokens(token_hash);
