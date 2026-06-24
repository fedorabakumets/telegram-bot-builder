/**
 * @fileoverview Клиентские типы для вкладки «Агент» (персональные токены MCP)
 *
 * @module editor/agent/agent-token-types
 */

/** Безопасное представление токена агента (без секрета), приходящее с сервера */
export interface AgentTokenDto {
  /** Уникальный идентификатор токена */
  id: number;
  /** Пользовательское имя токена */
  label: string;
  /** Публичный префикс токена (mcp_…) */
  prefix: string;
  /** Права токена через запятую (read / read,write) */
  scopes: string;
  /** Дата создания токена (ISO-строка) */
  createdAt: string | null;
  /** Дата последнего использования (null — ни разу) */
  lastUsedAt: string | null;
  /** Дата истечения токена (null — бессрочный) */
  expiresAt: string | null;
  /** Дата отзыва токена (null — активен) */
  revokedAt: string | null;
}

/** Тело запроса на создание токена агента */
export interface CreateAgentTokenBody {
  /** Пользовательское имя токена */
  label: string;
  /** Права токена (read / read,write) */
  scopes: "read" | "read,write";
  /** Срок действия в днях (не указан — бессрочный) */
  expiresInDays?: number;
}

/** Ответ сервера на создание токена — полный секрет показывается один раз */
export interface CreateAgentTokenResponse {
  /** Полный секрет токена (показывается единожды) */
  token: string;
  /** Метаданные созданного токена */
  record: AgentTokenDto;
}
