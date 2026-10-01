/**
 * @fileoverview Ожидание запуска трёх сервисов площадки после развёртывания шаблона.
 * @module server/sites/railway/waitSiteServices
 */

import type { RailwayAuth } from "./railwayGraphql";
import { isFailedDeployment, latestSiteDeployments, listSiteServices, type RailwaySiteProject } from "./railwaySiteProject";
import { SITE_SERVICES } from "./siteTemplateConfig";

/** Пауза между проверками */
const POLL_MS = 5_000;

/**
 * Ждёт, пока у Runner, Redis и Postgres последний деплой станет SUCCESS
 * @param auth - Токен пользователя
 * @param project - Проект площадки
 * @param timeoutMs - Сколько ждать
 * @param log - Сообщения о смене статусов
 * @returns имя сервиса → ID
 * @throws Error, если сервис упал или не поднялся вовремя
 */
export async function waitSiteServices(
  auth: RailwayAuth,
  project: RailwaySiteProject,
  timeoutMs: number,
  log: (message: string) => void,
): Promise<Map<string, string>> {
  const names = Object.values(SITE_SERVICES);
  const deadline = Date.now() + timeoutMs;
  let lastSummary = "";
  while (Date.now() < deadline) {
    const services = await listSiteServices(auth, project.projectId);
    const statuses = await latestSiteDeployments(auth, project);
    const states = names.map((name) => {
      const id = services.get(name);
      return { name, status: (id && statuses.get(id)) || "нет деплоя" };
    });
    const summary = states.map((s) => `${s.name}=${s.status}`).join(", ");
    if (summary !== lastSummary) log(summary);
    lastSummary = summary;
    const failed = states.find((s) => isFailedDeployment(s.status));
    if (failed) throw new Error(`Сервис ${failed.name} не запустился: ${failed.status}`);
    if (states.every((s) => s.status === "SUCCESS")) return services;
    await new Promise((resolve) => setTimeout(resolve, POLL_MS));
  }
  throw new Error(`Сервисы площадки не запустились вовремя: ${lastSummary}`);
}
