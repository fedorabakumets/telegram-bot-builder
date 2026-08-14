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
    description:
      "Скоуп bot_users/bot_messages по token_id. Без параметра — данные всех токенов проекта.",
    param: {
      description:
        "Опциональный ID токена бота. Без него — все токены проекта.",
      example: "7",
    },
  }),
});

/** Строка enum для OpenAPI description */
export const BOT_USERS_GRANULARITY_OPENAPI = "1m|5m|1h|1w|1d|7d|30d";

/** Гранулярность графиков прироста / кнопок (1w — 7 дней, шаг 1 день) */
export const BotUsersGranularityEnum = z
  .enum(["1m", "5m", "1h", "1w", "1d", "7d", "30d"])
  .openapi({ example: "1d" });

/** Query списка пользователей / диалогов */
export const BotUsersListQuerySchema = z.object({
  /** ID токена бота */
  tokenId: z.string().optional().openapi({
    example: "7",
    description:
      "Скоуп данных по bot_tokens.id. Без параметра — пользователи/группы всех токенов проекта.",
    param: {
      description:
        "Скоуп по token_id бота. Без параметра — все токены проекта.",
      example: "7",
    },
  }),
  /** Размер страницы; без limit — legacy-массив */
  limit: z.string().optional().openapi({
    example: "50",
    description: "Лимит записей. Без limit — плоский массив (legacy).",
    param: {
      description: "Размер страницы; без параметра — legacy-массив без пагинации",
      example: "50",
    },
  }),
  /** Смещение пагинации */
  offset: z.string().optional().openapi({
    example: "0",
    description: "Смещение для пагинации (с limit)",
    param: { description: "Смещение страницы (нужен limit)", example: "0" },
  }),
  /** Поиск по имени, username, user_id или тексту */
  search: z.string().optional().openapi({
    example: "иван",
    description:
      "ILIKE по имени/username/user_id и тексту сообщений диалога (только в режиме с limit)",
    param: {
      description: "Поиск по имени, username, user_id или тексту сообщений",
      example: "иван",
    },
  }),
  /** Фильтр активности */
  filterActive: z.enum(["true", "false"]).optional().openapi({
    description: "true — только is_active=1; false — только неактивные",
    param: {
      description: "Фильтр активности: true | false",
      example: "true",
    },
  }),
  /** Поле сортировки (whitelist на сервере) */
  sortBy: z.string().optional().openapi({
    example: "lastInteraction",
    description:
      "Whitelist: lastInteraction | createdAt | interactionCount | firstName | userName",
    param: {
      description: "Поле сортировки (whitelist на сервере)",
      example: "lastInteraction",
    },
  }),
  /** Направление сортировки */
  sortDir: z.enum(["asc", "desc"]).optional().openapi({
    example: "desc",
    description: "asc или desc (по умолчанию desc)",
    param: { description: "Направление сортировки", example: "desc" },
  }),
  /**
   * Тип диалогов: all | users | groups | channels.
   * Имеет приоритет над includeGroups.
   */
  dialogKind: z.enum(["all", "users", "groups", "channels"]).optional().openapi({
    example: "all",
    description:
      "all — люди+группы+каналы; users — только люди; groups — group/supergroup; channels — каналы",
    param: {
      description: "Фильтр типа диалога (приоритетнее includeGroups)",
      example: "all",
    },
  }),
  /** Legacy: включить группы (≈ dialogKind=all) */
  includeGroups: z.enum(["true", "false"]).optional().openapi({
    example: "true",
    description: "Legacy: true ≈ dialogKind=all. Лучше использовать dialogKind",
    param: {
      description: "Legacy-флаг групп (предпочтительнее dialogKind)",
      example: "true",
    },
  }),
});
