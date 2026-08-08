/**
 * @fileoverview OpenAPI: upload media (multipart / from-url).
 * @module server/swagger/paths/media-upload-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { UnauthorizedSchema } from "../schemas/common";
import {
  MediaCookiesSchema,
  MediaErrorSchema,
  MediaFileDtoSchema,
  MediaProjectIdParamsSchema,
} from "../schemas/media";
import { MEDIA_FILE_EXAMPLE } from "./media-examples";

const UploadFromUrlBodySchema = z
  .object({
    imageUrl: z.string().optional().openapi({ example: "https://example.com/a.jpg" }),
    projectId: z.number().int().openapi({ example: 42 }),
    nodeName: z.string().openapi({ example: "start" }),
    imageBase64: z.string().optional(),
  })
  .openapi("UploadMediaFromUrlRequest");

/**
 * Регистрирует upload / upload-multiple / upload-from-url.
 * @param registry - Реестр
 * @param cookieSecurity - Security
 * @returns void
 */
export function registerMediaUploadPaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "post",
    path: "/api/media/upload/{projectId}",
    tags: ["media"],
    summary: "Загрузить один файл (multipart)",
    description:
      "multipart field `file`. `requireProjectAccess`. **Клиент:** `use-media`.\n\n" +
      "```bash\ncurl -s -X POST http://localhost:5000/api/media/upload/42 -b cookies.txt -F file=@photo.jpg\n```",
    security: cookieSecurity,
    request: { cookies: MediaCookiesSchema, params: MediaProjectIdParamsSchema },
    responses: {
      200: {
        description: "Созданный media_files",
        content: {
          "application/json": { schema: MediaFileDtoSchema, example: MEDIA_FILE_EXAMPLE },
        },
      },
      401: { description: "Не авторизован", content: { "application/json": { schema: UnauthorizedSchema } } },
      403: { description: "Нет доступа", content: { "application/json": { schema: MediaErrorSchema } } },
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/media/upload-multiple/{projectId}",
    tags: ["media"],
    summary: "Загрузить до 20 файлов (multipart)",
    description:
      "multipart field `files` (≤20). `requireProjectAccess`.\n\n" +
      "```bash\ncurl -s -X POST http://localhost:5000/api/media/upload-multiple/42 -b cookies.txt -F files=@a.jpg -F files=@b.jpg\n```",
    security: cookieSecurity,
    request: { cookies: MediaCookiesSchema, params: MediaProjectIdParamsSchema },
    responses: {
      200: {
        description: "Массив созданных файлов",
        content: { "application/json": { schema: z.array(MediaFileDtoSchema) } },
      },
      401: { description: "Не авторизован", content: { "application/json": { schema: UnauthorizedSchema } } },
      403: { description: "Нет доступа", content: { "application/json": { schema: MediaErrorSchema } } },
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/media/upload-from-url",
    tags: ["media"],
    summary: "Сохранить картинку по URL/base64 в uploads/",
    description:
      "Пишет файл в `uploads/{projectId}/…`. **Доступ:** `hasProjectAccess(projectId)` " +
      "(раньше не проверялся — IDOR закрыт).\n\n" +
      "UI сейчас почти не вызывает.\n\n" +
      "```bash\ncurl -s -X POST http://localhost:5000/api/media/upload-from-url -b cookies.txt \\\n" +
      "  -H 'Content-Type: application/json' \\\n" +
      "  -d '{\"projectId\":42,\"nodeName\":\"start\",\"imageUrl\":\"https://example.com/a.jpg\"}'\n```",
    security: cookieSecurity,
    request: {
      cookies: MediaCookiesSchema,
      body: {
        required: true,
        content: {
          "application/json": {
            schema: UploadFromUrlBodySchema,
            example: { projectId: 42, nodeName: "start", imageUrl: "https://example.com/a.jpg" },
          },
        },
      },
    },
    responses: {
      200: { description: "Файл сохранён", content: { "application/json": { schema: z.object({ success: z.boolean(), url: z.string().optional() }) } } },
      400: { description: "Нет projectId/nodeName", content: { "application/json": { schema: MediaErrorSchema } } },
      401: { description: "Не авторизован", content: { "application/json": { schema: UnauthorizedSchema } } },
      403: { description: "Нет доступа к проекту", content: { "application/json": { schema: MediaErrorSchema, example: { success: false, error: "Нет доступа к проекту" } } } },
    },
  });
}
