/**
 * @fileoverview Общие path/query-параметры эндпоинтов project-users.
 * @module server/swagger/schemas/bot-users-params
 */

import "./common";
import { z } from "zod";

/** Path: ID проекта (`/api/projects/{id}/users…`) */
export const BotUsersProjectIdParamsSchema = z.object({
  /** Числовой ID проекта */
  id: z.string().openapi({
    example: "42",
    description: "Числовой ID проекта",
    param: { description: "Числовой ID проекта", example: "42" },
  }),
});

/** Path: projectId + Telegram userId */
export const BotUsersItemParamsSchema = z.object({
  /** ID проекта */
  projectId: z.string().openapi({
    example: "42",
    description: "ID проекта",
    param: { description: "ID проекта", example: "42" },
  }),
  /** Telegram user_id */
  userId: z.string().openapi({
    example: "123456789",
    description: "Telegram user_id",
    param: { description: "Telegram user_id", example: "123456789" },
  }),
});

/** Опциональный скоуп по токену бота (`getRequestTokenId`) */
export const BotUsersTokenQuerySchema = z.object({
  /** ID токена бота */
  tokenId: z.string().optional().openapi({
    example: "7",
    description: "Фильтр bot_users/bot_messages.token_id; без параметра — все токены",
    param: {
      description: "Опциональный token_id бота",
      example: "7",
    },
  }),
});

/** Гранулярность графиков прироста / кнопок */
export const BotUsersGranularityEnum = z
  .enum(["1m", "5m", "1h", "1d", "7d", "30d"])
  .openapi({ example: "1d" });

/** Query списка пользователей / диалогов */
export const BotUsersListQuerySchema = z.object({
  /** ID токена бота */
  tokenId: z.string().optional().openapi({
    example: "7",
    description: "Фильтр по токену бота",
  }),
  /** Размер страницы; без limit — legacy-массив */
  limit: z.string().optional().openapi({ example: "50" }),
  /** Смещение пагинации */
  offset: z.string().optional().openapi({ example: "0" }),
  /** Поиск по имени, username, user_id или тексту */
  search: z.string().optional().openapi({ example: "иван" }),
  /** Фильтр активности */
  filterActive: z.enum(["true", "false"]).optional(),
  /** Поле сортировки (whitelist на сервере) */
  sortBy: z.string().optional().openapi({ example: "lastInteraction" }),
  /** Направление сортировки */
  sortDir: z.enum(["asc", "desc"]).optional().openapi({ example: "desc" }),
  /**
   * Тип диалогов: all | users | groups | channels.
   * Имеет приоритет над includeGroups.
   */
  dialogKind: z.enum(["all", "users", "groups", "channels"]).optional().openapi({
    example: "all",
  }),
  /** Legacy: включить группы (≈ dialogKind=all) */
  includeGroups: z.enum(["true", "false"]).optional().openapi({ example: "true" }),
});
