/**
 * @fileoverview OpenAPI: GET/PUT admin-ids и POST admin-ids/remove.
 * @module server/swagger/paths/projects-admin-ids-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { UnauthorizedSchema } from "../schemas/common";
import { ProjectsCookiesSchema } from "../schemas/projects";
import {
  AdminIdsErrorSchema,
  AdminIdsMutationResponseSchema,
  AdminIdsProjectIdParamsSchema,
  AdminIdsResponseSchema,
  RemoveAdminIdRequestSchema,
  UpdateAdminIdsRequestSchema,
} from "../schemas/project-admin-ids";
import {
  ADMIN_IDS_GET_EMPTY_EXAMPLE,
  ADMIN_IDS_GET_ERROR_EXAMPLE,
  ADMIN_IDS_GET_EXAMPLE,
  ADMIN_IDS_MUTATION_OK_EXAMPLE,
  ADMIN_IDS_PUT_BODY_EXAMPLE,
  ADMIN_IDS_PUT_ERROR_EXAMPLE,
  ADMIN_IDS_REMOVE_BODY_EXAMPLE,
  ADMIN_IDS_REMOVE_ERROR_EXAMPLE,
  ADMIN_IDS_REMOVE_OK_EXAMPLE,
} from "./projects-admin-ids-examples";

/**
 * Регистрирует эндпоинты списка администраторов проекта (ADMIN_IDS).
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerProjectsAdminIdsPaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "get",
    path: "/api/projects/{id}/admin-ids",
    tags: ["projects"],
    summary: "Список ADMIN_IDS проекта",
    description:
      "Читает ID администраторов бота. Сначала `bot_projects.admin_ids`, " +
      "если пусто — fallback на `ADMIN_IDS` в `.env` папки бота.\n\n" +
      "**Параметры:** path `id`. Auth — cookie / Bearer PAT + `requireProjectAccess`.\n\n" +
      "**Клиент:** `BotAdminIds` / `use-admin-ids`, генератор кода, " +
      "шаблон «Менеджер ботов» (HTTP GET).\n\n" +
      "```bash\n" +
      "curl -s http://localhost:5000/api/projects/42/admin-ids -b cookies.txt\n" +
      "```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      params: AdminIdsProjectIdParamsSchema,
    },
    responses: {
      200: {
        description: "Список админов (может быть пустым)",
        content: {
          "application/json": {
            schema: AdminIdsResponseSchema,
            examples: {
              withAdmins: {
                summary: "Есть админы",
                value: ADMIN_IDS_GET_EXAMPLE,
              },
              empty: {
                summary: "Пусто",
                value: ADMIN_IDS_GET_EMPTY_EXAMPLE,
              },
            },
          },
        },
      },
      401: {
        description: "Нет session cookie и Bearer PAT",
        content: {
          "application/json": {
            schema: UnauthorizedSchema,
            example: { error: "UNAUTHORIZED" },
          },
        },
      },
      500: {
        description: "Ошибка чтения БД / .env",
        content: {
          "application/json": {
            schema: AdminIdsErrorSchema,
            example: ADMIN_IDS_GET_ERROR_EXAMPLE,
          },
        },
      },
    },
  });

  registry.registerPath({
    method: "put",
    path: "/api/projects/{id}/admin-ids",
    tags: ["projects"],
    summary: "Заменить ADMIN_IDS проекта",
    description:
      "Полностью перезаписывает список админов в БД. Если есть папка бота — " +
      "синхронизирует `ADMIN_IDS` в `.env`.\n\n" +
      "**Тело:** `{ adminIds: \"id1,id2\" }` — строка через запятую.\n\n" +
      "**Клиент:** сохранение в профиле бота, панель env, " +
      "«Менеджер ботов» (добавление админа через PUT).\n\n" +
      "```bash\n" +
      "curl -s -X PUT http://localhost:5000/api/projects/42/admin-ids -b cookies.txt \\\n" +
      "  -H 'Content-Type: application/json' \\\n" +
      "  -d '{\"adminIds\":\"123456789,987654321\"}'\n" +
      "```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      params: AdminIdsProjectIdParamsSchema,
      body: {
        content: {
          "application/json": {
            schema: UpdateAdminIdsRequestSchema,
            example: ADMIN_IDS_PUT_BODY_EXAMPLE,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Список сохранён",
        content: {
          "application/json": {
            schema: AdminIdsMutationResponseSchema,
            example: ADMIN_IDS_MUTATION_OK_EXAMPLE,
          },
        },
      },
      401: {
        description: "Нет session cookie и Bearer PAT",
        content: {
          "application/json": {
            schema: UnauthorizedSchema,
            example: { error: "UNAUTHORIZED" },
          },
        },
      },
      500: {
        description: "Ошибка записи БД / .env",
        content: {
          "application/json": {
            schema: AdminIdsErrorSchema,
            example: ADMIN_IDS_PUT_ERROR_EXAMPLE,
          },
        },
      },
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/projects/{id}/admin-ids/remove",
    tags: ["projects"],
    summary: "Удалить одного администратора из ADMIN_IDS",
    description:
      "Убирает один Telegram ID из списка. Body `adminId` — число или " +
      "`del_admin_{id}` (callback из шаблона «Менеджер ботов»).\n\n" +
      "Обновляет БД и `.env` при наличии. Studio UI обычно делает `PUT` " +
      "с новым списком; этот эндпоинт — для HTTP из бота-менеджера.\n\n" +
      "```bash\n" +
      "curl -s -X POST http://localhost:5000/api/projects/42/admin-ids/remove \\\n" +
      "  -b cookies.txt -H 'Content-Type: application/json' \\\n" +
      "  -d '{\"adminId\":\"del_admin_987654321\"}'\n" +
      "```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      params: AdminIdsProjectIdParamsSchema,
      body: {
        content: {
          "application/json": {
            schema: RemoveAdminIdRequestSchema,
            example: ADMIN_IDS_REMOVE_BODY_EXAMPLE,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Админ удалён, возвращён новый список",
        content: {
          "application/json": {
            schema: AdminIdsMutationResponseSchema,
            example: ADMIN_IDS_REMOVE_OK_EXAMPLE,
          },
        },
      },
      401: {
        description: "Нет session cookie и Bearer PAT",
        content: {
          "application/json": {
            schema: UnauthorizedSchema,
            example: { error: "UNAUTHORIZED" },
          },
        },
      },
      500: {
        description: "Ошибка удаления",
        content: {
          "application/json": {
            schema: AdminIdsErrorSchema,
            example: ADMIN_IDS_REMOVE_ERROR_EXAMPLE,
          },
        },
      },
    },
  });
}
