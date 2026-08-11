/**
 * @fileoverview OpenAPI-схемы lifecycle/профиля project-bot.
 * @module server/swagger/schemas/project-bot
 */

import "./common";
import { z } from "zod";

/** Path `{id}` проекта (lifecycle routes) */
export const ProjectBotIdParamsSchema = z.object({
  /** ID проекта */
  id: z.string().openapi({
    example: "42",
    description: "ID проекта",
    param: { description: "ID проекта", example: "42" },
  }),
});

/** Path `{projectId}` (info/data) */
export const ProjectBotProjectIdParamsSchema = z.object({
  /** ID проекта */
  projectId: z.string().openapi({
    example: "42",
    description: "ID проекта",
    param: { description: "ID проекта", example: "42" },
  }),
});

/** Query tokenId для GET info */
export const ProjectBotTokenQuerySchema = z.object({
  /** ID токена бота (иначе default) */
  tokenId: z.string().optional().openapi({
    example: "7",
    param: { description: "ID токена бота проекта", example: "7" },
  }),
});

/** Body start/stop/restart */
export const ProjectBotTokenBodySchema = z
  .object({
    /** ID токена бота проекта */
    tokenId: z.union([z.number().int(), z.string()]).optional().openapi({
      example: 7,
      description: "tokenId проекта. Без него start/restart — default токен.",
    }),
  })
  .openapi("ProjectBotTokenBody");

/** Успех start/restart */
export const ProjectBotStartOkSchema = z
  .object({
    message: z.string().openapi({ example: "Бот успешно запущен" }),
    processId: z.string().optional().openapi({ example: "12345" }),
    tokenUsed: z.boolean().optional().openapi({ example: true }),
  })
  .openapi("ProjectBotStartOk");

/** Успех stop */
export const ProjectBotStopOkSchema = z
  .object({
    message: z.string().openapi({ example: "Бот успешно остановлен" }),
  })
  .openapi("ProjectBotStopOk");

/** Успех restart-all */
export const ProjectBotRestartAllOkSchema = z
  .object({
    message: z.string().optional(),
    restarted: z.number().int().openapi({ example: 2 }),
    results: z
      .array(
        z.object({
          tokenId: z.number().int(),
          success: z.boolean(),
          processId: z.string().optional(),
          error: z.string().optional(),
        }),
      )
      .optional(),
  })
  .openapi("ProjectBotRestartAllOk");

/** Ответ GET …/bot/info (getMe + флаги) */
export const ProjectBotInfoSchema = z
  .object({
    id: z.number().int().optional().openapi({ example: 123456789 }),
    is_bot: z.boolean().optional().openapi({ example: true }),
    first_name: z.string().optional().openapi({ example: "Support Bot" }),
    username: z.string().optional().openapi({ example: "my_support_bot" }),
    hasToken: z.boolean().optional().openapi({ example: false }),
    photoUrl: z.union([z.literal(true), z.null()]).optional(),
    tokenId: z.number().int().optional().openapi({ example: 7 }),
  })
  .openapi("ProjectBotInfo");

/** Ответ GET …/bot/data (формат bot_users для диалогов) */
export const ProjectBotDataSchema = z
  .object({
    id: z.string().openapi({ example: "123456789" }),
    userId: z.string().openapi({ example: "123456789" }),
    avatarUrl: z.string().nullable().optional(),
    userName: z.string().nullable().optional().openapi({ example: "my_support_bot" }),
    firstName: z.string().nullable().optional().openapi({ example: "Support Bot" }),
    isBot: z.boolean().optional().openapi({ example: true }),
  })
  .nullable()
  .openapi("ProjectBotData");
