/**
 * @fileoverview Общие ответы OpenAPI для диалога поддержки в админке
 * @module server/swagger/paths/admin-support-responses
 */

import { z } from "zod";
import { AdminUnauthorizedSchema } from "../schemas/admin-common";
import { SupportErrorSchema } from "../schemas/support-chat";
import { ADMIN_UNAUTHORIZED_EXAMPLE } from "./admin-examples";

/** Параметр идентификатора диалога */
export const supportThreadIdParams = z.object({
  id: z.string().openapi({ description: "Идентификатор диалога", example: "1" }),
});

/** Ответ 401: нет cookie admin_auth */
export const adminSupportUnauthorized = {
  description: "Нет admin-сессии",
  content: {
    "application/json": { schema: AdminUnauthorizedSchema, example: ADMIN_UNAUTHORIZED_EXAMPLE },
  },
};

/** Ответ 400: идентификатор не положительное целое */
export const adminSupportBadId = {
  description: "Неверный идентификатор",
  content: {
    "application/json": {
      schema: SupportErrorSchema,
      example: { error: "Неверный идентификатор диалога" },
    },
  },
};

/** Ответ 404: диалог не найден */
export const adminSupportNotFound = {
  description: "Диалог не найден",
  content: {
    "application/json": { schema: SupportErrorSchema, example: { error: "Диалог не найден" } },
  },
};
