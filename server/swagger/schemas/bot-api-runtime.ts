/**
 * @fileoverview OpenAPI DTO status/photo/users для `/api/bot/tokens/*`.
 * @module server/swagger/schemas/bot-api-runtime
 */

import "./common";
import { z } from "zod";

/** Ответ GET …/status */
export const BotApiTokenStatusSchema = z
  .object({
    status: z.string(),
    userStats: z
      .object({
        total: z.string(),
        active_24h: z.string(),
        active_7d: z.string(),
        new_today: z.string(),
      })
      .optional(),
    instance: z.object({
      botName: z.string(),
      botUsername: z.string().nullable().optional(),
      tokenId: z.number().int(),
      status: z.string(),
      statusLabel: z.string().optional(),
      uptime: z.string().nullable().optional(),
      startedAt: z.union([z.string(), z.date()]).nullable().optional(),
      processId: z.string().nullable().optional(),
    }),
  })
  .openapi("BotApiTokenStatus");

/** Ответ GET …/photo */
export const BotApiTokenPhotoSchema = z
  .object({
    photoUrl: z.string().nullable(),
    total_count: z.number().optional(),
    error: z.string().optional(),
  })
  .openapi("BotApiTokenPhoto");

/** Элемент списка пользователей бота */
export const BotApiBotUserItemSchema = z
  .object({
    userId: z.union([z.string(), z.number()]),
    userName: z.string().nullable().optional(),
    firstName: z.string().nullable().optional(),
    lastName: z.string().nullable().optional(),
    avatarUrl: z.string().nullable().optional(),
    registeredAt: z.union([z.string(), z.date()]).nullable().optional(),
    lastInteraction: z.union([z.string(), z.date()]).nullable().optional(),
    interactionCount: z.number().nullable().optional(),
    isActive: z.union([z.number(), z.boolean()]).nullable().optional(),
    userData: z.unknown().optional(),
  })
  .openapi("BotApiBotUserItem");

/** Список пользователей с пагинацией */
export const BotApiBotUserListSchema = z
  .object({
    items: z.array(BotApiBotUserItemSchema),
    count: z.number().int(),
    nextOffset: z.number().nullable().optional(),
    prevOffset: z.number().nullable().optional(),
    fromItem: z.number().optional(),
    toItem: z.number().optional(),
  })
  .openapi("BotApiBotUserList");

/** Один пользователь + photoUrl */
export const BotApiBotUserDetailSchema = z
  .object({
    userId: z.union([z.string(), z.number()]),
    userName: z.string().nullable().optional(),
    firstName: z.string().nullable().optional(),
    lastName: z.string().nullable().optional(),
    registeredAt: z.string().nullable().optional(),
    lastInteraction: z.string().nullable().optional(),
    interactionCount: z.number().nullable().optional(),
    isActive: z.union([z.number(), z.boolean()]).nullable().optional(),
    photoUrl: z.string().nullable().optional(),
  })
  .openapi("BotApiBotUserDetail");

/** Path tokenId + userId */
export const BotApiTokenUserParamsSchema = z.object({
  tokenId: z.string().openapi({
    example: "7",
    param: { description: "ID токена или token_7", example: "7" },
  }),
  userId: z.string().openapi({
    example: "1612141295",
    param: { description: "Telegram user id или user_…", example: "1612141295" },
  }),
});

/** Query пагинации users */
export const BotApiUsersQuerySchema = z.object({
  telegram_id: z.string().optional().openapi({
    example: "123456789",
    param: {
      description: "Actor telegram_id (см. auth-модель bot)",
      example: "123456789",
    },
  }),
  limit: z.string().optional().openapi({
    example: "10",
    param: { description: "Лимит (макс 50, по умолчанию 10)", example: "10" },
  }),
  offset: z.string().optional().openapi({
    example: "0",
    param: { description: "Смещение", example: "0" },
  }),
});
