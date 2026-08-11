/**
 * @fileoverview Path/query-параметры эндпоинтов project-messages.
 * @module server/swagger/schemas/project-messages-params
 */

import "./common";
import { z } from "zod";
import { BotUsersGranularityEnum } from "./bot-users-params";

/** Path: ID проекта (`/api/projects/{id}/messages/…`) */
export const ProjectMessagesProjectIdParamsSchema = z.object({
  /** Числовой ID проекта */
  id: z.string().openapi({
    example: "42",
    description: "Числовой ID проекта",
    param: { description: "Числовой ID проекта", example: "42" },
  }),
});

/** Path: projectId + messageId (DELETE/PATCH) */
export const ProjectMessagesItemParamsSchema = z.object({
  /** ID проекта */
  projectId: z.string().openapi({
    example: "42",
    description: "ID проекта",
    param: { description: "ID проекта", example: "42" },
  }),
  /** Внутренний ID строки bot_messages */
  messageId: z.string().openapi({
    example: "501",
    description: "ID сообщения в bot_messages",
    param: { description: "ID сообщения в bot_messages", example: "501" },
  }),
});

/** Опциональный скоуп по токену бота (`getRequestTokenId`) — фильтр списка/аналитики */
export const ProjectMessagesTokenQuerySchema = z.object({
  /** ID токена бота */
  tokenId: z.string().optional().openapi({
    example: "7",
    description:
      "Скоуп bot_messages по token_id. Без параметра — все токены проекта.",
    param: {
      description: "Опциональный ID токена бота. Без него — все токены.",
      example: "7",
    },
  }),
});

/**
 * tokenId для DELETE/PATCH — выбор токена через resolveEffectiveProjectToken
 * (не фильтр «все токены»).
 */
export const ProjectMessagesResolveTokenQuerySchema = z.object({
  /** ID токена бота для Telegram API */
  tokenId: z.string().optional().openapi({
    example: "7",
    description:
      "Токен бота для Telegram API. Без него — resolveEffectiveProjectToken (default/first).",
    param: {
      description: "ID токена бота; иначе default/first токен проекта",
      example: "7",
    },
  }),
});

/** Query GET …/messages/all */
export const ProjectMessagesAllQuerySchema = ProjectMessagesTokenQuerySchema.extend({
  /** Лимит записей (default 200) */
  limit: z.string().optional().openapi({
    example: "200",
    description: "Лимит записей (по умолчанию 200)",
    param: { description: "Лимит записей (default 200)", example: "200" },
  }),
  /** Смещение пагинации (default 0) */
  offset: z.string().optional().openapi({
    example: "0",
    description: "Смещение (по умолчанию 0)",
    param: { description: "Смещение пагинации (default 0)", example: "0" },
  }),
});

/** Query GET …/messages/activity */
export const ProjectMessagesActivityQuerySchema = ProjectMessagesTokenQuerySchema.extend({
  /**
   * Гранулярность (предпочтительно). Короткие окна — bot_messages + fill gaps;
   * 1d|7d|30d — message_activity_daily.
   */
  granularity: BotUsersGranularityEnum.optional().openapi({
    example: "1h",
    description: "1m|5m|1h|1d|7d|30d",
  }),
  /** Legacy-период без granularity: 7d|30d|90d (default 30d) */
  period: z.enum(["7d", "30d", "90d"]).optional().openapi({
    example: "30d",
    description: "Обратная совместимость; игнорируется при granularity",
  }),
  /** Разбивка входящих/исходящих вместо count */
  split: z.enum(["true"]).optional().openapi({
    example: "true",
    description: 'При "true" — [{date, incoming, outgoing}] вместо [{date, count}]',
    param: {
      description: 'true — разбивка incoming/outgoing',
      example: "true",
    },
  }),
});
