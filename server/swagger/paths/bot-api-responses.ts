/**
 * @fileoverview Общие response-блоки OpenAPI тега bot.
 * @module server/swagger/paths/bot-api-responses
 */

import { UnauthorizedSchema } from "../schemas/common";
import { BotApiErrorSchema } from "../schemas/bot-api";

/** Типичные 401/403 для `/api/bot/*` */
export const BOT_API_AUTH_ERRORS = {
  401: {
    description: "Нет session/PAT",
    content: { "application/json": { schema: UnauthorizedSchema } },
  },
  403: {
    description: "Нет доступа / чужой telegram_id без bot_manager",
    content: { "application/json": { schema: BotApiErrorSchema } },
  },
} as const;

/** 400 + auth errors */
export const BOT_API_BAD_AUTH_ERRORS = {
  400: {
    description: "Некорректный id / валидация / bot_manager без telegram_id",
    content: { "application/json": { schema: BotApiErrorSchema } },
  },
  ...BOT_API_AUTH_ERRORS,
} as const;

/** 400/401/403/404 */
export const BOT_API_CRUD_ERRORS = {
  ...BOT_API_BAD_AUTH_ERRORS,
  404: {
    description: "Ресурс не найден",
    content: { "application/json": { schema: BotApiErrorSchema } },
  },
} as const;
