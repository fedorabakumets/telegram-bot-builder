/**
 * @fileoverview Примеры JSON для OpenAPI тега agent-tokens.
 * @module server/swagger/paths/agent-token-examples
 */

/** Пример DTO токена (без секрета) */
export const AGENT_TOKEN_DTO_EXAMPLE = {
  id: 1,
  label: "Cursor MCP",
  prefix: "mcp_a1b2",
  scopes: "read,write",
  createdAt: "2026-08-01T10:00:00.000Z",
  lastUsedAt: "2026-08-08T12:00:00.000Z",
  expiresAt: null,
  revokedAt: null,
};

/** Пример списка GET /api/agent-tokens */
export const AGENT_TOKEN_LIST_EXAMPLE = [AGENT_TOKEN_DTO_EXAMPLE];

/** Тело POST /api/agent-tokens */
export const CREATE_AGENT_TOKEN_BODY_EXAMPLE = {
  label: "Cursor MCP",
  scopes: "read,write" as const,
  expiresInDays: 90,
};

/** Успех создания — секрет один раз */
export const CREATE_AGENT_TOKEN_OK_EXAMPLE = {
  token: "mcp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  record: AGENT_TOKEN_DTO_EXAMPLE,
};

/** Успех DELETE */
export const REVOKE_AGENT_TOKEN_OK_EXAMPLE = { success: true as const };

/** 401 */
export const AGENT_TOKEN_UNAUTHORIZED_EXAMPLE = {
  error: "Пользователь не аутентифицирован",
};

/** 404 revoke */
export const AGENT_TOKEN_NOT_FOUND_EXAMPLE = {
  error: "Токен не найден",
};
