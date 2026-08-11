/**
 * @fileoverview OpenAPI: storage-quota + telegram-file.
 * @module server/swagger/paths/project-files-proxy-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { MessageErrorSchema, UnauthorizedSchema } from "../schemas/common";
import { ProjectsCookiesSchema, ProjectsAuthHeadersSchema } from "../schemas/projects";
import {
  ProjectFilesProjectIdParamsSchema,
  StorageQuotaResponseSchema,
  TelegramFileQuerySchema,
} from "../schemas/project-files";
import {
  PROJECT_FILES_FORBIDDEN_EXAMPLE,
  STORAGE_QUOTA_EXAMPLE,
} from "./project-files-examples";

/**
 * Регистрирует квоту хранилища и прокси Telegram-файла.
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerProjectFilesProxyPaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "get",
    path: "/api/projects/{projectId}/storage-quota",
    tags: ["project-files"],
    summary: "Квота локального хранилища",
    description:
      "Занято байт по локальным бэкендам проекта, лимит (`STORAGE_LIMIT_GB`, null = безлимит) " +
      "и мягкий флаг `quotaExceeded`. S3 в квоту не входит.\n\n" +
      "**Клиент:** `StorageQuotaBar` / `use-storage-quota`.\n\n" +
      "```bash\ncurl -s -b cookies.txt 'http://localhost:5000/api/projects/42/storage-quota'\n```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      headers: ProjectsAuthHeadersSchema,
      params: ProjectFilesProjectIdParamsSchema,
    },
    responses: {
      200: {
        description: "Квота",
        content: {
          "application/json": {
            schema: StorageQuotaResponseSchema,
            example: STORAGE_QUOTA_EXAMPLE,
          },
        },
      },
      401: {
        description: "Нет session / PAT",
        content: {
          "application/json": {
            schema: UnauthorizedSchema,
            example: { error: "UNAUTHORIZED" },
          },
        },
      },
      403: {
        description: "Нет доступа к проекту",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: PROJECT_FILES_FORBIDDEN_EXAMPLE,
          },
        },
      },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api/projects/{projectId}/telegram-file",
    tags: ["project-files"],
    summary: "Прокси файла из Telegram CDN",
    description:
      "Стримит файл по `fileId` через бота проекта (токен не светится клиенту). " +
      "Поддерживает Range. Cache-Control: private. " +
      "Превью в таблице файлов, диалогах, медиа-карточках.\n\n" +
      "```bash\ncurl -s -o out.jpg -b cookies.txt \\\n" +
      "  'http://localhost:5000/api/projects/42/telegram-file?fileId=AgAC&tokenId=7'\n```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      headers: ProjectsAuthHeadersSchema,
      params: ProjectFilesProjectIdParamsSchema,
      query: TelegramFileQuerySchema,
    },
    responses: {
      200: {
        description: "Байты файла (или 206 Partial Content)",
        content: {
          "application/octet-stream": {
            schema: z.string().openapi({ format: "binary" }),
          },
        },
      },
      400: {
        description: "Нет fileId / projectId",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Неверные параметры запроса" },
          },
        },
      },
      401: {
        description: "Нет session / PAT",
        content: {
          "application/json": {
            schema: UnauthorizedSchema,
            example: { error: "UNAUTHORIZED" },
          },
        },
      },
      403: {
        description: "Нет доступа к проекту",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: PROJECT_FILES_FORBIDDEN_EXAMPLE,
          },
        },
      },
      404: {
        description: "Нет токена или файла в Telegram",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Файл не найден в Telegram" },
          },
        },
      },
    },
  });
}
