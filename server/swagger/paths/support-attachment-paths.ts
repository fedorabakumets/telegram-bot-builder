/**
 * @fileoverview OpenAPI: скачивание картинок чата поддержки
 * @module server/swagger/paths/support-attachment-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { ADMIN_SECURITY, AdminCookiesSchema } from "../schemas/admin-common";
import { SupportErrorSchema, SupportSessionCookiesSchema } from "../schemas/support-chat";

/** Идентификатор вложения */
const attachmentIdParams = z.object({
  id: z.string().openapi({ description: "Идентификатор вложения", example: "1" }),
});

/** Тело ответа: байты картинки */
const imageBody = {
  description: "Картинка. Content-Type — сохранённый MIME, Content-Disposition: inline",
  content: {
    "image/png": { schema: z.string().openapi({ format: "binary" }) },
    "image/jpeg": { schema: z.string().openapi({ format: "binary" }) },
    "image/webp": { schema: z.string().openapi({ format: "binary" }) },
    "image/gif": { schema: z.string().openapi({ format: "binary" }) },
  },
};

/**
 * Регистрирует GET вложения для пользователя и для администратора
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie или Bearer PAT
 * @returns void
 */
export function registerSupportAttachmentPaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "get",
    path: "/api/support/attachments/{id}",
    tags: ["support"],
    summary: "Картинка своего диалога",
    description:
      "Отдаёт файл только автору диалога. Тип проверен при загрузке: png, jpeg, webp или gif.\n\n" +
      "```bash\ncurl -s http://localhost:5000/api/support/attachments/1 -b cookies.txt -o screen.png\n```",
    security: cookieSecurity,
    request: { cookies: SupportSessionCookiesSchema, params: attachmentIdParams },
    responses: {
      200: imageBody,
      401: {
        description: "Нет сессии",
        content: { "application/json": { schema: SupportErrorSchema, example: { error: "Требуется авторизация через Telegram" } } },
      },
      404: {
        description: "Нет файла или он из чужого диалога",
        content: { "application/json": { schema: SupportErrorSchema, example: { error: "Файл не найден" } } },
      },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/admin/api/support/attachments/{id}",
    tags: ["admin"],
    summary: "Картинка диалога поддержки",
    description:
      "Отдаёт файл администратору по cookie `admin_auth`.\n\n" +
      "```bash\ncurl -s http://localhost:5000/admin/api/support/attachments/1 -b admin.txt -o screen.png\n```",
    security: ADMIN_SECURITY,
    request: { cookies: AdminCookiesSchema, params: attachmentIdParams },
    responses: {
      200: imageBody,
      401: {
        description: "Нет admin-сессии",
        content: { "application/json": { schema: SupportErrorSchema, example: { error: "Unauthorized" } } },
      },
      404: {
        description: "Файл не найден",
        content: { "application/json": { schema: SupportErrorSchema, example: { error: "Файл не найден" } } },
      },
    },
  });
}
