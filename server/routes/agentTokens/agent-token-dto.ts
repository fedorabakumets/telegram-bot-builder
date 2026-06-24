/**
 * @fileoverview DTO-преобразование записи персонального токена агента (PAT)
 *
 * Отдаёт клиенту ТОЛЬКО безопасные метаданные токена. Секрет (`tokenHash`)
 * и владелец (`ownerId`) никогда не попадают в ответ API.
 *
 * @module agentTokens/agent-token-dto
 */

import type { AgentToken } from "@shared/schema";

/** Безопасное представление токена агента для отдачи клиенту */
export interface AgentTokenDto {
  /** Уникальный идентификатор токена */
  id: number;
  /** Пользовательское имя токена */
  label: string;
  /** Публичный префикс токена (mcp_…) */
  prefix: string;
  /** Права токена через запятую (read / read,write) */
  scopes: string;
  /** Дата создания токена */
  createdAt: Date | null;
  /** Дата последнего использования (null — ни разу) */
  lastUsedAt: Date | null;
  /** Дата истечения токена (null — бессрочный) */
  expiresAt: Date | null;
  /** Дата отзыва токена (null — активен) */
  revokedAt: Date | null;
}

/**
 * Преобразует запись токена из БД в безопасный DTO без секрета и владельца.
 * @param t - Запись токена агента из БД
 * @returns Безопасное представление токена
 */
export function toAgentTokenDto(t: AgentToken): AgentTokenDto {
  return {
    id: t.id,
    label: t.label,
    prefix: t.prefix,
    scopes: t.scopes,
    createdAt: t.createdAt,
    lastUsedAt: t.lastUsedAt,
    expiresAt: t.expiresAt,
    revokedAt: t.revokedAt,
  };
}
