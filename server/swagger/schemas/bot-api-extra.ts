/**
 * @fileoverview OpenAPI DTO токенов/env/users для `/api/bot/*`.
 * @module server/swagger/schemas/bot-api-extra
 */

import "./common";
import { z } from "zod";

/** Экспорт project.json как file (base64) */
export const BotApiExportFileSchema = z
  .object({
    type: z.literal("file"),
    data: z.string(),
    mimeType: z.string(),
    fileName: z.string(),
  })
  .openapi("BotApiExportFile");

/** Ответ PUT …/data */
export const BotApiImportDataResultSchema = z
  .object({
    id: z.number().int(),
    name: z.string(),
    updatedAt: z.union([z.string(), z.date()]).nullable().optional(),
    sheetsCount: z.number().int(),
    nodesCount: z.number().int(),
  })
  .openapi("BotApiImportDataResult");

/** Элемент списка токенов проекта (может содержать секрет token) */
export const BotApiTokenListItemSchema = z
  .object({
    id: z.number().int(),
    name: z.string(),
    botUsername: z.string().nullable().optional(),
    botFirstName: z.string().nullable().optional(),
    isDefault: z.union([z.number(), z.boolean()]).optional(),
    isActive: z.union([z.number(), z.boolean()]).optional(),
    botStatus: z.string().optional(),
    token: z.string().optional(),
    userStats: z
      .object({
        total: z.string(),
        active_24h: z.string(),
        active_7d: z.string(),
        new_today: z.string(),
      })
      .optional(),
  })
  .openapi("BotApiTokenListItem");

/** Список токенов */
export const BotApiTokenListSchema = z
  .object({
    items: z.array(BotApiTokenListItemSchema),
    count: z.number().int(),
  })
  .openapi("BotApiTokenList");

/** Тело создания токена */
export const BotApiCreateTokenBodySchema = z
  .object({
    token: z.string(),
    name: z.string().optional(),
  })
  .openapi("BotApiCreateTokenBody");

/** Ответ создания токена */
export const BotApiTokenCreatedSchema = z
  .object({
    id: z.number().int(),
    name: z.string(),
    projectId: z.number().int(),
    createdAt: z.union([z.string(), z.date()]).nullable().optional(),
  })
  .openapi("BotApiTokenCreated");

/** Коллаборатор */
export const BotApiCollaboratorSchema = z
  .object({
    projectId: z.number().int(),
    userId: z.number(),
    invitedBy: z.number().nullable().optional(),
    createdAt: z.union([z.string(), z.date()]).nullable().optional(),
  })
  .openapi("BotApiCollaborator");

/** Список коллабораторов */
export const BotApiCollaboratorListSchema = z
  .object({
    items: z.array(BotApiCollaboratorSchema),
    count: z.number().int(),
  })
  .openapi("BotApiCollaboratorList");

/** Тело добавления коллаборатора */
export const BotApiAddCollaboratorBodySchema = z
  .object({ user_id: z.number() })
  .openapi("BotApiAddCollaboratorBody");

/** Env-переменная (секреты в списке маскируются) */
export const BotApiEnvVariableSchema = z
  .object({
    id: z.number().int(),
    tokenId: z.number().int(),
    key: z.string(),
    value: z.string(),
    isSecret: z.number().nullable().optional(),
    createdAt: z.union([z.string(), z.date()]).nullable().optional(),
    updatedAt: z.union([z.string(), z.date()]).nullable().optional(),
  })
  .openapi("BotApiEnvVariable");

/** Список env */
export const BotApiEnvListSchema = z
  .object({
    items: z.array(BotApiEnvVariableSchema),
    count: z.number().int(),
  })
  .openapi("BotApiEnvList");

/** Тело создания env */
export const BotApiCreateEnvBodySchema = z
  .object({
    key: z.string(),
    value: z.string().optional(),
    isSecret: z.number().optional(),
  })
  .openapi("BotApiCreateEnvBody");

/** Тело PATCH env */
export const BotApiUpdateEnvBodySchema = z
  .object({
    key: z.string().optional(),
    value: z.string().optional(),
    isSecret: z.number().optional(),
  })
  .openapi("BotApiUpdateEnvBody");

/** Статистика пользователей токена */
export const BotApiTokenStatsSchema = z
  .object({
    total_users: z.number(),
    active_24h: z.number(),
    active_7d: z.number(),
    new_today: z.number(),
  })
  .openapi("BotApiTokenStats");
