/**
 * @fileoverview OpenAPI: GET/HEAD /api/health.
 * @module server/swagger/paths/health-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { HealthResponseSchema } from "../schemas/health";

/** Пример ответа GET /api/health */
const HEALTH_OK_EXAMPLE = {
  database: true,
  templates: true,
  ready: true,
};

/**
 * Регистрирует публичный healthcheck.
 * @param registry - Реестр zod-to-openapi
 * @param publicSecurity - Пустой security
 * @returns void
 */
export function registerHealthPaths(
  registry: OpenAPIRegistry,
  publicSecurity: never[],
): void {
  registry.registerPath({
    method: "get",
    path: "/api/health",
    tags: ["health"],
    summary: "Healthcheck компонентов",
    description:
      "Публичный liveness/readiness без авторизации.\n\n" +
      "- `database` — БД инициализирована\n" +
      "- `templates` — системные шаблоны загружены (независимо от БД)\n" +
      "- `ready` — **равно `database`** (API считает себя готовым при готовой БД)\n\n" +
      "UI: `ServerStatus` (поллинг до `ready`). Railway/балансировщики — этот path.\n" +
      "Заменяет устаревший `GET /api`.\n\n" +
      "```bash\n" +
      "curl -s http://localhost:5000/api/health\n" +
      "```",
    security: publicSecurity,
    responses: {
      200: {
        description: "Статус компонентов",
        content: {
          "application/json": {
            schema: HealthResponseSchema,
            example: HEALTH_OK_EXAMPLE,
          },
        },
      },
    },
  });

  registry.registerPath({
    method: "head",
    path: "/api/health",
    tags: ["health"],
    summary: "Healthcheck без тела (204)",
    description:
      "Тот же probe, что GET, но **без JSON**: ответ **204** и пустое тело.\n\n" +
      "Удобно для load balancer health checks.\n\n" +
      "```bash\n" +
      "curl -s -I -X HEAD http://localhost:5000/api/health\n" +
      "```",
    security: publicSecurity,
    responses: {
      204: {
        description: "Сервер отвечает, тела нет",
      },
    },
  });
}
