/** @fileoverview OpenAPI приёма и опроса фонового массового перезапуска. */
import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { MessageErrorSchema } from "../schemas/common";
import { ProjectsCookiesSchema, ProjectsAuthHeadersSchema } from "../schemas/projects";
import { ProjectBotIdParamsSchema } from "../schemas/project-bot";
import { ProjectRestartJobSchema } from "../schemas/project-restart-job";
import { PROJECT_BOT_RESTART_ALL_EXAMPLE } from "./project-bot-examples";

/** Регистрирует быстрый POST и авторизованный GET состояния задания. */
export function registerProjectBotRestartAllPaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  const errors = Object.fromEntries([400, 401, 403, 409, 503].map(status => [status, {
    description: status === 409 ? "Другой перезапуск проекта уже выполняется" : "Запрос отклонён",
    content: { "application/json": { schema: MessageErrorSchema } },
  }]));
  registry.registerPath({
    method: "post", path: "/api/projects/{id}/bot/restart-all", tags: ["project-bot"],
    summary: "Принять массовый перезапуск в фоне",
    description: "Сразу возвращает 202 и jobId; это принятие, а не подтверждение перезапуска. " +
      "Опросите GET /api/projects/{id}/bot/restart-all/jobs/{jobId} до completed или failed. " +
      "Повтор во время работы возвращает тот же jobId и не запускает вторую работу. " +
      "Перезапускаются только running-боты. Результат может содержать частичные ошибки. " +
      "Задания хранятся в памяти панели до часа: после перезапуска панели GET даёт 404, " +
      "при котором нужно перечитать статусы ботов, а не считать операцию успешной.",
    security: cookieSecurity,
    request: { cookies: ProjectsCookiesSchema, headers: ProjectsAuthHeadersSchema, params: ProjectBotIdParamsSchema },
    responses: { 202: { description: "Задание принято либо уже выполняется",
      content: { "application/json": { schema: ProjectRestartJobSchema, example: PROJECT_BOT_RESTART_ALL_EXAMPLE } } }, ...errors },
  });
  registry.registerPath({
    method: "get", path: "/api/projects/{id}/bot/restart-all/jobs/{jobId}", tags: ["project-bot"],
    summary: "Прочитать прогресс массового перезапуска", security: cookieSecurity,
    description: "Доступ заново проверяется для проекта. Чужой или утраченный jobId не раскрывает результаты. " +
      "Опрос не блокируется на длительных операциях остановки и запуска.",
    request: { cookies: ProjectsCookiesSchema, headers: ProjectsAuthHeadersSchema,
      params: ProjectBotIdParamsSchema.extend({ jobId: z.string().uuid() }) },
    responses: { 200: { description: "Текущий снимок задания",
      content: { "application/json": { schema: ProjectRestartJobSchema } } },
      404: { description: "Задание не найдено либо истекло; перечитайте статусы ботов",
        content: { "application/json": { schema: MessageErrorSchema.extend({ code: z.literal('RESTART_JOB_NOT_FOUND') }) } } },
      ...errors },
  });
}
