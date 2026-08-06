/**
 * @fileoverview OpenAPI paths для Worker Pool (/api/workers/stats)
 * @module server/swagger/paths/worker-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { SetupRequiredSchema, UnauthorizedSchema } from "../schemas/common";
import {
  WorkerPoolStatsEmptySchema,
  WorkerPoolStatsSchema,
  WorkerStatsErrorSchema,
} from "../schemas/workers";

/**
 * Регистрирует детальные OpenAPI paths статистики Worker Pool.
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Security requirement для session cookie / PAT
 * @returns void
 */
export function registerWorkerPaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "get",
    path: "/api/workers/stats",
    tags: ["workers"],
    summary: "Статистика Worker Pool",
    description:
      "Возвращает агрегированную статистику Python Worker Pool для **текущего пользователя**.\n\n" +
      "**Модель:** один проект = один процесс `worker.py` (asyncio event loop), внутри — несколько ботов " +
      "(по `tokenId`). Активен при `USE_WORKER_POOL !== 'false'` (по умолчанию включён).\n\n" +
      "**Изоляция (IDOR):** в `details` только воркеры проектов, доступных владельцу/коллаборатору. " +
      "Агрегаты `workers`, `totalBots`, `totalMemoryMb` пересчитываются после фильтрации. " +
      "Внутренний `pid` процесса **не** возвращается.\n\n" +
      "**Авторизация:** session cookie (`connect.sid`) или Bearer PAT (`agentToken`). " +
      "Без личности → `401` (глобальный `requireApiAuth`).\n\n" +
      "**Клиент:** компонент `WorkerPoolStatus` в панели бота опрашивает эндпоинт каждые 10 с " +
      "и показывает бейдж «N воркеров · M ботов · RAM» (скрыт, если `workers === 0`).\n\n" +
      "**Память:** `memoryMb` — RSS процесса воркера (Windows: `tasklist`, Linux/macOS: `ps`). " +
      "При ошибке чтения памяти поле может быть `0`.\n\n" +
      "**Пустой ответ (`workers: 0`):** нет запущенных ботов, воркеры уже завершили drain, " +
      "или Worker Pool отключён в окружении.",
    security: cookieSecurity,
    responses: {
      200: {
        description:
          "Статистика воркеров владельца. Если активных воркеров нет — нули и пустой `details`.",
        content: {
          "application/json": {
            schema: WorkerPoolStatsSchema,
            examples: {
              active: {
                summary: "Два проекта с ботами",
                value: {
                  workers: 2,
                  totalBots: 3,
                  totalMemoryMb: 145,
                  details: [
                    { projectId: 266, botsCount: 1, memoryMb: 72 },
                    { projectId: 42, botsCount: 2, memoryMb: 73 },
                  ],
                },
              },
              empty: {
                summary: "Нет активных воркеров",
                value: {
                  workers: 0,
                  totalBots: 0,
                  totalMemoryMb: 0,
                  details: [],
                },
              },
            },
          },
        },
      },
      401: {
        description: "Не авторизован (нет session cookie и Bearer PAT)",
        content: {
          "application/json": {
            schema: UnauthorizedSchema,
            example: { error: "UNAUTHORIZED" },
          },
        },
      },
      500: {
        description: "Внутренняя ошибка при чтении статистики воркеров",
        content: {
          "application/json": {
            schema: WorkerStatsErrorSchema,
            example: { message: "Не удалось получить статистику воркеров" },
          },
        },
      },
      503: {
        description:
          "Глобальный middleware `setupGuard`: приложение ещё не прошло первоначальную настройку " +
          "(страница `/setup`). Не специфично для workers — так отвечают почти все `/api/*` до setup.",
        content: {
          "application/json": {
            schema: SetupRequiredSchema,
            example: {
              setupRequired: true,
              message: "Приложение не настроено. Перейдите на /setup",
            },
          },
        },
      },
    },
  });

  /** Регистрация пустого варианта для cross-reference в UI */
  void WorkerPoolStatsEmptySchema;
}
