/**
 * @fileoverview OpenAPI: put/delete/use/file-id media.
 * @module server/swagger/paths/media-mutate-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { UnauthorizedSchema } from "../schemas/common";
import {
  MediaCookiesSchema,
  MediaErrorSchema,
  MediaFileDtoSchema,
  MediaIdParamsSchema,
} from "../schemas/media";
import { MEDIA_FILE_EXAMPLE } from "./media-examples";

/**
 * Регистрирует mutate-операции media.
 * @param registry - Реестр
 * @param cookieSecurity - Security
 * @returns void
 */
export function registerMediaMutatePaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "put",
    path: "/api/media/{id}",
    tags: ["media"],
    summary: "Обновить метаданные медиа",
    description:
      "`requireMediaOwnership`. **Клиент:** `use-media` / thumbnail.\n\n" +
      "```bash\ncurl -s -X PUT http://localhost:5000/api/media/10 -b cookies.txt \\\n" +
      "  -H 'Content-Type: application/json' -d '{\"description\":\"cover\"}'\n```",
    security: cookieSecurity,
    request: {
      cookies: MediaCookiesSchema,
      params: MediaIdParamsSchema,
      body: { content: { "application/json": { schema: z.record(z.unknown()) } } },
    },
    responses: {
      200: {
        description: "Обновлённый файл",
        content: { "application/json": { schema: MediaFileDtoSchema, example: MEDIA_FILE_EXAMPLE } },
      },
      401: { description: "Не авторизован", content: { "application/json": { schema: UnauthorizedSchema } } },
      403: { description: "Чужой файл", content: { "application/json": { schema: MediaErrorSchema } } },
    },
  });

  registry.registerPath({
    method: "delete",
    path: "/api/media/{id}",
    tags: ["media"],
    summary: "Удалить медиафайл",
    description:
      "`requireMediaOwnership`. **Клиент:** `use-media`.\n\n" +
      "```bash\ncurl -s -X DELETE http://localhost:5000/api/media/10 -b cookies.txt\n```",
    security: cookieSecurity,
    request: { cookies: MediaCookiesSchema, params: MediaIdParamsSchema },
    responses: {
      200: { description: "Удалён", content: { "application/json": { schema: z.object({ message: z.string() }) } } },
      401: { description: "Не авторизован", content: { "application/json": { schema: UnauthorizedSchema } } },
      403: { description: "Чужой файл", content: { "application/json": { schema: MediaErrorSchema } } },
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/media/{id}/use",
    tags: ["media"],
    summary: "Инкремент usageCount",
    description:
      "`requireMediaOwnership`. **Клиент:** `use-media`.\n\n" +
      "```bash\ncurl -s -X POST http://localhost:5000/api/media/10/use -b cookies.txt\n```",
    security: cookieSecurity,
    request: { cookies: MediaCookiesSchema, params: MediaIdParamsSchema },
    responses: {
      200: { description: "Счётчик обновлён", content: { "application/json": { schema: MediaFileDtoSchema } } },
      401: { description: "Не авторизован", content: { "application/json": { schema: UnauthorizedSchema } } },
      403: { description: "Чужой файл", content: { "application/json": { schema: MediaErrorSchema } } },
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/media/{id}/file-id",
    tags: ["media"],
    summary: "Upsert Telegram file_id для токена",
    description:
      "`requireMediaFileOwnership`. Для бот/integration; UI не вызывает.\n\n" +
      "```bash\ncurl -s -X POST http://localhost:5000/api/media/10/file-id -b cookies.txt \\\n" +
      "  -H 'Content-Type: application/json' -d '{\"tokenId\":7,\"fileId\":\"AgAC…\"}'\n```",
    security: cookieSecurity,
    request: {
      cookies: MediaCookiesSchema,
      params: MediaIdParamsSchema,
      body: {
        content: {
          "application/json": {
            schema: z.object({
              tokenId: z.number().int().openapi({ example: 7 }),
              fileId: z.string().openapi({ example: "AgACAgIAAxkBAAI…" }),
            }),
          },
        },
      },
    },
    responses: {
      200: { description: "file_id сохранён", content: { "application/json": { schema: z.record(z.unknown()) } } },
      401: { description: "Не авторизован", content: { "application/json": { schema: UnauthorizedSchema } } },
      403: { description: "Нет доступа", content: { "application/json": { schema: MediaErrorSchema } } },
    },
  });
}
