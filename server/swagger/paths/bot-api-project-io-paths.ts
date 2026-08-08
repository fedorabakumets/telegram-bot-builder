/**
 * @fileoverview OpenAPI: export и PUT data проекта.
 * @module server/swagger/paths/bot-api-project-io-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import {
  BotApiCookiesSchema,
  BotApiProjectIdParamsSchema,
  BotApiTelegramIdQuerySchema,
} from "../schemas/bot-api";
import {
  BotApiExportFileSchema,
  BotApiImportDataResultSchema,
} from "../schemas/bot-api-extra";
import { BOT_API_AUTH_DOC } from "./bot-api-auth-doc";
import { BOT_API_CRUD_ERRORS } from "./bot-api-responses";

/**
 * Регистрирует GET export и PUT data.
 * @param registry - Реестр
 * @param cookieSecurity - Security schemes
 * @returns void
 */
export function registerBotApiProjectIoPaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  const req = {
    cookies: BotApiCookiesSchema,
    params: BotApiProjectIdParamsSchema,
    query: BotApiTelegramIdQuerySchema.partial(),
  };

  registry.registerPath({
    method: "get",
    path: "/api/bot/projects/{id}/export",
    tags: ["bot"],
    summary: "Экспорт project.json (base64 file)",
    description:
      BOT_API_AUTH_DOC +
      "Ответ совместим с медиа-нодой (`type: file`). **Клиент:** unused (не в UI/шаблоне).\n\n" +
      "```bash\ncurl -s 'http://localhost:5000/api/bot/projects/42/export?telegram_id=123' \\\n" +
      "  -H 'Authorization: Bearer mcp_…'\n```",
    security: cookieSecurity,
    request: req,
    responses: {
      200: {
        description: "Файл base64",
        content: {
          "application/json": {
            schema: BotApiExportFileSchema,
            example: {
              type: "file",
              data: "eyJzaGVldHMiOltdfQ==",
              mimeType: "application/json",
              fileName: "Мой_бот.json",
            },
          },
        },
      },
      ...BOT_API_CRUD_ERRORS,
    },
  });

  registry.registerPath({
    method: "put",
    path: "/api/bot/projects/{id}/data",
    tags: ["bot"],
    summary: "Заменить data существующего проекта",
    description:
      BOT_API_AUTH_DOC +
      "Тело: `{ sheets }` или `{ json_data }`. Токены не очищаются. **Клиент:** unused.\n\n" +
      "```bash\ncurl -s -X PUT 'http://localhost:5000/api/bot/projects/42/data?telegram_id=123' \\\n" +
      "  -H 'Authorization: Bearer mcp_…' -H 'Content-Type: application/json' -d @project.json\n```",
    security: cookieSecurity,
    request: {
      ...req,
      body: { content: { "application/json": { schema: z.record(z.unknown()) } } },
    },
    responses: {
      200: {
        description: "Сводка обновления",
        content: {
          "application/json": {
            schema: BotApiImportDataResultSchema,
            example: { id: 42, name: "Мой бот", sheetsCount: 1, nodesCount: 12 },
          },
        },
      },
      ...BOT_API_CRUD_ERRORS,
    },
  });
}
