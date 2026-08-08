/**
 * @fileoverview OpenAPI: check-url / download-url(s).
 * @module server/swagger/paths/media-url-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { UnauthorizedSchema } from "../schemas/common";
import {
  MediaCookiesSchema,
  MediaErrorSchema,
  MediaProjectIdParamsSchema,
} from "../schemas/media";

/**
 * Регистрирует URL-probe и скачивание в проект.
 * @param registry - Реестр
 * @param cookieSecurity - Security
 * @returns void
 */
export function registerMediaUrlPaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "post",
    path: "/api/media/check-url",
    tags: ["media"],
    summary: "Проверить внешний URL медиа",
    description:
      "Probe доступности/типа URL. SSRF ограничен `validateExternalUrl`. " +
      "Только global auth (без projectId). **Клиент:** url-downloader.\n\n" +
      "```bash\ncurl -s -X POST http://localhost:5000/api/media/check-url -b cookies.txt \\\n" +
      "  -H 'Content-Type: application/json' -d '{\"url\":\"https://example.com/a.jpg\"}'\n```",
    security: cookieSecurity,
    request: {
      cookies: MediaCookiesSchema,
      body: {
        content: {
          "application/json": {
            schema: z.object({ url: z.string().openapi({ example: "https://example.com/a.jpg" }) }),
            example: { url: "https://example.com/a.jpg" },
          },
        },
      },
    },
    responses: {
      200: { description: "Результат проверки", content: { "application/json": { schema: z.record(z.unknown()) } } },
      401: { description: "Не авторизован", content: { "application/json": { schema: UnauthorizedSchema } } },
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/media/download-url/{projectId}",
    tags: ["media"],
    summary: "Скачать один URL в медиа проекта",
    description:
      "`requireProjectAccess` + SSRF-check. **Клиент:** url-downloader.\n\n" +
      "```bash\ncurl -s -X POST http://localhost:5000/api/media/download-url/42 -b cookies.txt \\\n" +
      "  -H 'Content-Type: application/json' -d '{\"url\":\"https://example.com/a.jpg\"}'\n```",
    security: cookieSecurity,
    request: {
      cookies: MediaCookiesSchema,
      params: MediaProjectIdParamsSchema,
      body: {
        content: {
          "application/json": {
            schema: z.object({ url: z.string() }),
            example: { url: "https://example.com/a.jpg" },
          },
        },
      },
    },
    responses: {
      200: { description: "Созданный media_files", content: { "application/json": { schema: z.record(z.unknown()) } } },
      401: { description: "Не авторизован", content: { "application/json": { schema: UnauthorizedSchema } } },
      403: { description: "Нет доступа", content: { "application/json": { schema: MediaErrorSchema } } },
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/media/download-urls/{projectId}",
    tags: ["media"],
    summary: "Скачать несколько URL в медиа проекта",
    description:
      "Batch download. `requireProjectAccess`. **Клиент:** url-downloader.\n\n" +
      "```bash\ncurl -s -X POST http://localhost:5000/api/media/download-urls/42 -b cookies.txt \\\n" +
      "  -H 'Content-Type: application/json' -d '{\"urls\":[\"https://example.com/a.jpg\"]}'\n```",
    security: cookieSecurity,
    request: {
      cookies: MediaCookiesSchema,
      params: MediaProjectIdParamsSchema,
      body: {
        content: {
          "application/json": {
            schema: z.object({ urls: z.array(z.string()) }),
            example: { urls: ["https://example.com/a.jpg"] },
          },
        },
      },
    },
    responses: {
      200: { description: "Результаты batch", content: { "application/json": { schema: z.record(z.unknown()) } } },
      401: { description: "Не авторизован", content: { "application/json": { schema: UnauthorizedSchema } } },
      403: { description: "Нет доступа", content: { "application/json": { schema: MediaErrorSchema } } },
    },
  });
}
