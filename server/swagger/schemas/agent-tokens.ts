/**
 * @fileoverview OpenAPI-схемы персональных токенов агента (PAT)
 * @module server/swagger/schemas/agent-tokens
 */

import "./common";
import { z } from "zod";

/** Права токена агента */
export const AgentTokenScopesSchema = z
  .enum(["read", "read,write"])
  .openapi({ example: "read,write", description: "read — только чтение; read,write — чтение и запись" });

/** Безопасные метаданные токена (без секрета и ownerId) */
export const AgentTokenDtoSchema = z
  .object({
    /** ID записи токена */
    id: z.number().openapi({ example: 1 }),
    /** Пользовательское имя */
    label: z.string().openapi({ example: "Cursor MCP" }),
    /** Публичный префикс mcp_… */
    prefix: z.string().openapi({ example: "mcp_a1b2" }),
    /** Права через запятую */
    scopes: z.string().openapi({ example: "read,write" }),
    /** Дата создания */
    createdAt: z.union([z.string(), z.date()]).nullable().optional(),
    /** Последнее использование */
    lastUsedAt: z.union([z.string(), z.date()]).nullable().optional(),
    /** Истечение (null — бессрочный) */
    expiresAt: z.union([z.string(), z.date()]).nullable().optional(),
    /** Отзыв (null — активен) */
    revokedAt: z.union([z.string(), z.date()]).nullable().optional(),
  })
  .openapi("AgentToken");

/** Тело POST /api/agent-tokens */
export const CreateAgentTokenRequestSchema = z
  .object({
    /** Название токена */
    label: z.string().min(1).openapi({ example: "Cursor MCP" }),
    /** Права доступа */
    scopes: AgentTokenScopesSchema.optional().default("read,write"),
    /** Срок действия в днях (не указан — бессрочный) */
    expiresInDays: z.number().int().positive().optional().openapi({ example: 90 }),
  })
  .openapi("CreateAgentTokenRequest");

/** Ответ POST /api/agent-tokens — секрет показывается один раз */
export const CreateAgentTokenResponseSchema = z
  .object({
    /** Полный секрет PAT (mcp_…) — сохраните сразу, повторно не отдаётся */
    token: z.string().openapi({ example: "mcp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" }),
    /** Метаданные созданной записи */
    record: AgentTokenDtoSchema,
  })
  .openapi("CreateAgentTokenResponse");

/** Ответ GET /api/agent-tokens */
export const AgentTokenListSchema = z.array(AgentTokenDtoSchema).openapi("AgentTokenList");

/** Ошибка agent-tokens API */
export const AgentTokenErrorSchema = z
  .object({
    /** Текст ошибки */
    error: z.string().openapi({ example: "Пользователь не аутентифицирован" }),
  })
  .openapi("AgentTokenError");

/** Ошибка валидации при создании токена */
export const CreateAgentTokenValidationErrorSchema = z
  .object({
    error: z.string().openapi({ example: "Некорректные данные" }),
    /** Детали Zod issues */
    details: z.array(z.unknown()).optional(),
  })
  .openapi("CreateAgentTokenValidationError");

/** Ответ DELETE /api/agent-tokens/{id} */
export const RevokeAgentTokenResponseSchema = z
  .object({
    success: z.literal(true),
  })
  .openapi("RevokeAgentTokenResponse");
