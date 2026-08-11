/**
 * @fileoverview Общие 400/401/403/404 для settings toggles токена.
 * @module server/swagger/paths/project-tokens-settings-errors
 */

import {
  ForbiddenSchema,
  MessageErrorSchema,
  UnauthorizedSchema,
} from "../schemas/common";

/** Общие ошибки settings (requireTokenOwnership) */
export const PROJECT_TOKEN_SETTINGS_ERRORS = {
  400: {
    description: "Флаг не 0/1 или значение вне диапазона",
    content: { "application/json": { schema: MessageErrorSchema } },
  },
  401: {
    description: "Не авторизован",
    content: {
      "application/json": {
        schema: UnauthorizedSchema,
        example: { error: "UNAUTHORIZED" },
      },
    },
  },
  403: {
    description: "Нет владения токеном",
    content: { "application/json": { schema: ForbiddenSchema } },
  },
  404: {
    description: "Токен не найден",
    content: {
      "application/json": {
        schema: MessageErrorSchema,
        example: { message: "Токен не найден" },
      },
    },
  },
} as const;
