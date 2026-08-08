/**
 * @fileoverview OpenAPI-схемы `/api/bot/*` (общие + проекты).
 * @module server/swagger/schemas/bot-api
 */

import "./common";
import { z } from "zod";

/** Cookie / описание Bearer для bot API */
export const BotApiCookiesSchema = z.object({
  "connect.sid": z
    .string()
    .optional()
    .openapi({
      description: "Session Studio. Альтернатива — Bearer PAT.",
      example: "s%3Axxxx.yyyy",
      param: {
        description:
          "Session cookie. Для bot-manager предпочтителен Bearer PAT со scope bot_manager.",
        example: "s%3Axxxx.yyyy",
      },
    }),
});

/** Query telegram_id (частичный — `.partial()` в paths) */
export const BotApiTelegramIdQuerySchema = z.object({
  telegram_id: z.string().openapi({
    example: "123456789",
    param: {
      description:
        "Telegram user id актора. Обязателен при PAT scope bot_manager. " +
        "При личной сессии/PAT должен совпадать с req.user.id (или можно опустить).",
      example: "123456789",
    },
  }),
});

/** Ошибка bot API */
export const BotApiErrorSchema = z
  .object({
    error: z.string().optional(),
    message: z.string().optional(),
  })
  .openapi("BotApiError");

/** Path :id проекта (число или project_42) */
export const BotApiProjectIdParamsSchema = z.object({
  id: z.string().openapi({
    example: "42",
    param: { description: "ID проекта или project_42", example: "42" },
  }),
});

/** Path :tokenId */
export const BotApiTokenIdParamsSchema = z.object({
  tokenId: z.string().openapi({
    example: "7",
    param: { description: "ID токена или token_7", example: "7" },
  }),
});

/** Path :id env-переменной */
export const BotApiEnvIdParamsSchema = z.object({
  id: z.string().openapi({
    example: "15",
    param: { description: "ID bot_env_variables", example: "15" },
  }),
});

/** Path collaborators/:userId */
export const BotApiCollaboratorUserParamsSchema = z.object({
  id: z.string().openapi({
    example: "42",
    param: { description: "ID проекта", example: "42" },
  }),
  userId: z.string().openapi({
    example: "123456789",
    param: { description: "Telegram user id коллаборатора", example: "123456789" },
  }),
});

/** Успех без тела-данных */
export const BotApiSuccessSchema = z
  .object({ success: z.literal(true) })
  .openapi("BotApiSuccess");

/** Список проектов (safe DTO) */
export const BotApiProjectListSchema = z
  .object({
    items: z.array(
      z.object({
        id: z.number().int(),
        name: z.string(),
        description: z.string().nullable().optional(),
        createdAt: z.union([z.string(), z.date()]).nullable().optional(),
        updatedAt: z.union([z.string(), z.date()]).nullable().optional(),
        sortOrder: z.number().nullable().optional(),
      }),
    ),
    count: z.number().int(),
  })
  .openapi("BotApiProjectList");

/** Детали проекта (без data) */
export const BotApiProjectDetailSchema = z
  .object({
    id: z.number().int(),
    name: z.string(),
    description: z.string().nullable().optional(),
    createdAt: z.union([z.string(), z.date()]).nullable().optional(),
    updatedAt: z.union([z.string(), z.date()]).nullable().optional(),
  })
  .openapi("BotApiProjectDetail");

/** Тело создания проекта */
export const BotApiCreateProjectBodySchema = z
  .object({ name: z.string().optional() })
  .openapi("BotApiCreateProjectBody");

/** Ответ create/import проекта */
export const BotApiProjectCreatedSchema = z
  .object({
    id: z.number().int(),
    name: z.string(),
    createdAt: z.union([z.string(), z.date()]).nullable().optional(),
  })
  .openapi("BotApiProjectCreated");

/** Тело переименования */
export const BotApiRenameProjectBodySchema = z
  .object({ name: z.string() })
  .openapi("BotApiRenameProjectBody");

/** Ответ PATCH проекта */
export const BotApiProjectUpdatedSchema = z
  .object({
    id: z.number().int(),
    name: z.string(),
    updatedAt: z.union([z.string(), z.date()]).nullable().optional(),
  })
  .openapi("BotApiProjectUpdated");
