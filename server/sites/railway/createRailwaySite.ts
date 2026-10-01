/**
 * @fileoverview Создание площадки в аккаунте Railway пользователя по его токену:
 * проект → шаблон `tbb-site` → ожидание сервисов → адрес Redis → сведения исполнителя.
 * При ошибке недосозданный проект удаляется.
 * @module server/sites/railway/createRailwaySite
 */

import type { RunnerSiteInfo } from "../../redis/runnerSiteInfo";
import { waitRunnerSiteInfo } from "../waitRunnerSiteInfo";
import type { RailwayAuth } from "./railwayGraphql";
import { waitSiteServices } from "./waitSiteServices";
import { createSiteProject, deleteSiteProject, deploySiteTemplate, siteServiceVariables, type RailwaySiteProject } from "./railwaySiteProject";
import { DEFAULT_SITE_REGION, fetchSiteTemplate, prepareSiteTemplateConfig, SITE_SERVICES } from "./siteTemplateConfig";
import { resolveRailwayTarget } from "./railwayWorkspace";

/** Параметры создания площадки */
export interface CreateRailwaySiteOptions {
  /** Токен пользователя */
  auth: RailwayAuth;
  /** Имя проекта на Railway */
  name: string;
  /** Регион сервисов */
  region?: string;
  /** Workspace, если у аккаунта их несколько */
  workspaceId?: string;
  /** Образ исполнителя вместо образа из шаблона */
  runnerImage?: string;
  /** Не удалять проект при ошибке (для разбора) */
  keepOnFailure?: boolean;
  /** Сообщения о ходе создания */
  onProgress?: (message: string) => void;
}

/** Созданная площадка */
export interface RailwaySite extends RailwaySiteProject {
  /** Регион сервисов */
  region: string;
  /** Внешний адрес Redis: по нему панель управляет площадкой */
  redisPublicUrl: string;
  /** Сведения исполнителей площадки */
  runners: RunnerSiteInfo[];
}

/** Сколько ждать запуска сервисов */
const SERVICES_TIMEOUT_MS = 8 * 60_000;

/** Сколько ждать сведений исполнителя после запуска сервисов */
const RUNNER_TIMEOUT_MS = 2 * 60_000;

/**
 * Создаёт площадку и ждёт её готовности
 * @param options - Токен, имя, регион
 * @returns адрес Redis и сведения исполнителя
 * @throws Error с причиной; проект при этом удалён, если не задан keepOnFailure
 */
export async function createRailwaySite(options: CreateRailwaySiteOptions): Promise<RailwaySite> {
  const { auth } = options;
  const log = options.onProgress ?? (() => undefined);
  const region = options.region ?? DEFAULT_SITE_REGION;
  const target = await resolveRailwayTarget(auth, options.workspaceId);
  const template = await fetchSiteTemplate(auth);
  const config = prepareSiteTemplateConfig(template.config, { region, runnerImage: options.runnerImage });
  log(`Токен ${target.tokenKind === "account" ? "аккаунта" : "workspace"}, создаём проект ${options.name}`);
  const project = await createSiteProject(auth, target, options.name);
  log(`Проект ${project.projectId} создан`);
  try {
    await deploySiteTemplate(auth, project, template, config);
    log(`Шаблон развёрнут в ${region}, ждём сервисы`);
    const services = await waitSiteServices(auth, project, SERVICES_TIMEOUT_MS, log);
    const redisPublicUrl = (await siteServiceVariables(auth, project, services.get(SITE_SERVICES.redis)!)).REDIS_PUBLIC_URL;
    if (!redisPublicUrl) throw new Error("У Redis площадки нет REDIS_PUBLIC_URL");
    log("Сервисы работают, ждём исполнителя");
    const runners = await waitRunnerSiteInfo(redisPublicUrl, RUNNER_TIMEOUT_MS);
    return { ...project, region, redisPublicUrl, runners };
  } catch (error) {
    if (!options.keepOnFailure) {
      log(`Ошибка, удаляем проект ${project.projectId}`);
      await deleteSiteProject(auth, project.projectId).catch(() => undefined);
    }
    throw error;
  }
}
