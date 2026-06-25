/**
 * @fileoverview Криптографические хелперы для персональных токенов агента (PAT)
 * @module server/utils/agent-token-crypto
 */

import { createHash, randomBytes } from "node:crypto";

/** Результат генерации нового токена агента */
export interface GeneratedAgentToken {
  /** Полный секрет токена (показывается пользователю ОДИН раз) */
  token: string;
  /** Префикс токена (первые 12 символов) для отображения в списке */
  prefix: string;
  /** Хеш токена (sha-256 hex) для хранения в БД */
  tokenHash: string;
}

/**
 * Считает sha-256 хеш сырого токена в hex-представлении.
 * Используется и при генерации (для хранения), и при резолве (для поиска по хешу).
 * @param raw - Сырой секрет токена
 * @returns Хеш токена (sha-256 hex)
 */
export function hashAgentToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

/**
 * Генерирует новый персональный токен агента.
 * Секрет имеет вид `mcp_<base64url(randomBytes32)>` (256 бит энтропии);
 * в БД хранится только его sha-256 хеш, сам секрет показывается пользователю один раз.
 * @returns Объект с полным токеном, префиксом и хешем
 */
export function generateAgentToken(): GeneratedAgentToken {
  const token = "mcp_" + randomBytes(32).toString("base64url");
  const prefix = token.slice(0, 12);
  const tokenHash = hashAgentToken(token);
  return { token, prefix, tokenHash };
}
