/**
 * @fileoverview OpenAPI: list/search/get media.
 * @module server/swagger/paths/media-list-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { UnauthorizedSchema } from "../schemas/common";
import {
  MediaCookiesSchema,
  MediaErrorSchema,
  MediaFileDtoSchema,
  MediaFileListSchema,
  MediaIdParamsSchema,
  MediaProjectIdParamsSchema,
} from "../schemas/media";
import { MEDIA_FILE_EXAMPLE, MEDIA_LIST_EXAMPLE } from "./media-examples";

/**
 * Регистрирует GET list/search/by-id.
 * @param registry - Реестр
 * @param cookieSecurity - Security
 * @returns void
 */
export function registerMediaListPaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "get",
    path: "/api/media/project/{projectId}",
    tags: ["media"],
    summary: "Список медиафайлов проекта",
    description:
      "`requireProjectAccess`. **Клиент:** `use-media`.\n\n" +
      "```bash\ncurl -s http://localhost:5000/api/media/project/42 -b cookies.txt\n```",
    security: cookieSecurity,
    request: { cookies: MediaCookiesSchema, params: MediaProjectIdParamsSchema },
    responses: {
      200: {
        description: "Массив media_files (+ метаданные токенов при наличии)",
        content: {
          "application/json": { schema: MediaFileListSchema, example: MEDIA_LIST_EXAMPLE },
        },
      },
      401: { description: "Не авторизован", content: { "application/json": { schema: UnauthorizedSchema } } },
      403: { description: "Нет доступа к проекту", content: { "application/json": { schema: MediaErrorSchema } } },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api/media/search/{projectId}",
    tags: ["media"],
    summary: "Поиск медиафайлов проекта",
    description:
      "Query `q` — строка поиска. `requireProjectAccess`. **Клиент:** `use-media`.\n\n" +
      "```bash\ncurl -s 'http://localhost:5000/api/media/search/42?q=photo' -b cookies.txt\n```",
    security: cookieSecurity,
    request: {
      cookies: MediaCookiesSchema,
      params: MediaProjectIdParamsSchema,
      query: z.object({
        q: z.string().optional().openapi({
          example: "photo",
          param: { description: "Строка поиска по имени/тегам", example: "photo" },
        }),
      }),
    },
    responses: {
      200: {
        description: "Найденные файлы",
        content: {
          "application/json": { schema: MediaFileListSchema, example: MEDIA_LIST_EXAMPLE },
        },
      },
      401: { description: "Не авторизован", content: { "application/json": { schema: UnauthorizedSchema } } },
      403: { description: "Нет доступа", content: { "application/json": { schema: MediaErrorSchema } } },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api/media/{id}",
    tags: ["media"],
    summary: "Медиафайл по ID",
    description:
      "`requireMediaOwnership`. UI почти не вызывает (список через project).\n\n" +
      "```bash\ncurl -s http://localhost:5000/api/media/10 -b cookies.txt\n```",
    security: cookieSecurity,
    request: { cookies: MediaCookiesSchema, params: MediaIdParamsSchema },
    responses: {
      200: {
        description: "Один файл",
        content: {
          "application/json": { schema: MediaFileDtoSchema, example: MEDIA_FILE_EXAMPLE },
        },
      },
      401: { description: "Не авторизован", content: { "application/json": { schema: UnauthorizedSchema } } },
      403: { description: "Чужой файл", content: { "application/json": { schema: MediaErrorSchema } } },
      404: { description: "Не найден", content: { "application/json": { schema: MediaErrorSchema } } },
    },
  });
}
