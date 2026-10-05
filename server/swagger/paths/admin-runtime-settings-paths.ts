/**
 * @fileoverview OpenAPI: настройки рантайма в админке
 * @module server/swagger/paths/admin-runtime-settings-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { ADMIN_SECURITY, AdminCookiesSchema, AdminUnauthorizedSchema } from "../schemas/admin-common";
import { ADMIN_CURL_LOGIN, ADMIN_UNAUTHORIZED_EXAMPLE } from "./admin-examples";

/** Поле раздела без секрета */
const FieldSchema = z.object({
  env: z.string(),
  label: z.string(),
  kind: z.enum(["text", "number", "bool", "secret", "storage"]),
  hint: z.string().optional(),
  value: z.string(),
  configured: z.boolean(),
}).openapi("RuntimeFieldView");

/** Ответ GET раздела */
const GroupSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  fields: z.array(FieldSchema),
  storages: z.array(z.object({
    id: z.string(),
    name: z.string(),
    backend: z.string(),
    public: z.boolean(),
  })),
}).openapi("RuntimeGroupView");

/**
 * Регистрирует чтение, запись раздела и немедленный бэкап
 * @param registry - Реестр zod-to-openapi
 * @returns void
 */
export function registerAdminRuntimeSettingsPaths(registry: OpenAPIRegistry): void {
  const denied = {
    description: "Нет admin-сессии",
    content: { "application/json": { schema: AdminUnauthorizedSchema, example: ADMIN_UNAUTHORIZED_EXAMPLE } },
  };
  registry.registerPath({
    method: "get",
    path: "/admin/api/runtime-settings/{group}",
    tags: ["admin"],
    summary: "Раздел настроек рантайма",
    description:
      "Поля раздела. Секрет отдаётся только флагом `configured`, без значения. " +
      "Пока значение не сохранено, в `value` попадает живой process.env.\n\n" +
      `**Auth:** cookie \`admin_auth\`. **UI:** \`/admin/runtime/{group}\`.\n\n\`\`\`bash\n${ADMIN_CURL_LOGIN}\n` +
      "curl -s http://localhost:5000/admin/api/runtime-settings/backups -b admin.txt\n```",
    security: ADMIN_SECURITY,
    request: {
      cookies: AdminCookiesSchema,
      params: z.object({ group: z.string().openapi({ example: "backups" }) }),
    },
    responses: {
      200: { description: "Поля и хранилища", content: { "application/json": { schema: GroupSchema } } },
      401: denied,
      404: { description: "Неизвестный раздел" },
    },
  });
  registry.registerPath({
    method: "put",
    path: "/admin/api/runtime-settings/{group}",
    tags: ["admin"],
    summary: "Сохранить раздел настроек рантайма",
    description:
      "Пустой секрет не затирает старое значение. Пустая обычная строка удаляет ключ " +
      "и возвращает чтение из env. Секреты не пишутся в process.env. " +
      "Раздел backups перезапускает планировщик, storages обновляет s3-default.\n\n" +
      `\`\`\`bash\n${ADMIN_CURL_LOGIN}\n` +
      "curl -s -X PUT http://localhost:5000/admin/api/runtime-settings/workers -b admin.txt \\\n" +
      "  -H 'Content-Type: application/json' -d '{\"values\":{\"USE_WORKER_POOL\":\"true\"}}'\n```",
    security: ADMIN_SECURITY,
    request: {
      cookies: AdminCookiesSchema,
      params: z.object({ group: z.string() }),
      body: { content: { "application/json": { schema: z.object({ values: z.record(z.string(), z.string()) }) } } },
    },
    responses: {
      200: { description: "Сохранено", content: { "application/json": { schema: z.object({ ok: z.literal(true), warnings: z.array(z.string()) }) } } },
      400: { description: "Публичное хранилище или неверное тело" },
      401: denied,
    },
  });
  registry.registerPath({
    method: "post",
    path: "/admin/api/runtime-settings/backups/run",
    tags: ["admin"],
    summary: "Снять бэкап сейчас",
    description: "Дамп всех целей расписания. Публичное хранилище отклоняется.\n\n" +
      `\`\`\`bash\n${ADMIN_CURL_LOGIN}\ncurl -s -X POST http://localhost:5000/admin/api/runtime-settings/backups/run -b admin.txt\n\`\`\``,
    security: ADMIN_SECURITY,
    request: { cookies: AdminCookiesSchema },
    responses: {
      200: { description: "Метки баз", content: { "application/json": { schema: z.object({ ok: z.literal(true), labels: z.array(z.string()) }) } } },
      401: denied,
    },
  });
}
