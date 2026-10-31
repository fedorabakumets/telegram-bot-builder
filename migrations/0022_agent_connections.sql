-- @fileoverview Подключения доверенного Telegram-агента и привязка персональных токенов.
CREATE TABLE IF NOT EXISTS agent_connections (
  id SERIAL PRIMARY KEY,
  agent_id TEXT NOT NULL,
  owner_id BIGINT NOT NULL REFERENCES telegram_users(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT agent_connections_agent_owner_idx UNIQUE (agent_id, owner_id)
);
ALTER TABLE agent_tokens ADD COLUMN IF NOT EXISTS connection_id INTEGER REFERENCES agent_connections(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS agent_tokens_connection_idx ON agent_tokens(connection_id);
