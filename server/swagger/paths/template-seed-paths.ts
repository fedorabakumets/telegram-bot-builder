/**
 * @fileoverview OpenAPI paths: admin seed refresh/recreate системных сценариев.
 * @module server/swagger/paths/template-seed-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import {
  MessageErrorSchema,
  SetupRequiredSchema,
  UnauthorizedSchema,
} from "../schemas/common";
import { TemplateSeedOkSchema } from "../schemas/templates";

/**
 * Регистрирует POST refresh и recreate (`seedDefaultTemplates(true)`).
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerTemplateSeedPaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "post",
    path: "/api/templates/refresh",
    tags: ["templates"],
    summary: "Пересидить системные сценарии (force)",
    description:
      "Вызывает `seedDefaultTemplates(true)` — принудительное обновление системных шаблонов.\n\n" +
      "**Статус:** админ/дебаг seed — **UI не использует**.\n\n" +
      "**Дубль registration:** путь регистрируется **дважды** — в `setupTemplates` " +
      "(`message: \"Templates refreshed successfully\"`) и позже в `registerRoutes` " +
      "(ответ с `timestamp`). Express обрабатывает **первый** хендлер (`setupTemplates`); " +
      "второй — мёртвый код.\n\n" +
      "**Авторизация:** cookie/PAT; отдельной admin-проверки нет.",
    security: cookieSecurity,
    responses: {
      200: {
        description: "Seed выполнен (активный хендлер без timestamp)",
        content: {
          "application/json": {
            schema: TemplateSeedOkSchema,
            examples: {
              setupTemplates: {
                summary: "Активный (setupTemplates)",
                value: { message: "Templates refreshed successfully" },
              },
              deadDuplicate: {
                summary: "Мёртвый дубль (не достигается)",
                value: {
                  message: "Templates updated successfully",
                  timestamp: "2026-08-08T19:00:00.000Z",
                },
              },
            },
          },
        },
      },
      401: {
        description: "Не авторизован",
        content: { "application/json": { schema: UnauthorizedSchema } },
      },
      500: {
        description: "Ошибка seed",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Failed to refresh templates" },
          },
        },
      },
      503: {
        description: "Приложение не настроено",
        content: { "application/json": { schema: SetupRequiredSchema } },
      },
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/templates/recreate",
    tags: ["templates"],
    summary: "Пересоздать системные сценарии (иерархия)",
    description:
      "Тот же `seedDefaultTemplates(true)`, что и refresh; другое сообщение в ответе.\n\n" +
      "**Статус:** админ/дебаг seed — **UI не использует**.\n\n" +
      "**Отдаёт:** `{ message: \"Templates recreated with hierarchy successfully\" }`.\n\n" +
      "Отдельной admin-проверки нет — достаточно cookie/PAT.",
    security: cookieSecurity,
    responses: {
      200: {
        description: "Seed выполнен",
        content: {
          "application/json": {
            schema: TemplateSeedOkSchema,
            example: { message: "Templates recreated with hierarchy successfully" },
          },
        },
      },
      401: {
        description: "Не авторизован",
        content: { "application/json": { schema: UnauthorizedSchema } },
      },
      500: {
        description: "Ошибка seed",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Failed to recreate templates" },
          },
        },
      },
      503: {
        description: "Приложение не настроено",
        content: { "application/json": { schema: SetupRequiredSchema } },
      },
    },
  });
}
