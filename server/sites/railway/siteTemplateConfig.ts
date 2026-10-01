/**
 * @fileoverview Шаблон площадки на Railway (`tbb-site`): загрузка конфигурации
 * и подстановка региона и образа исполнителя перед развёртыванием.
 * @module server/sites/railway/siteTemplateConfig
 */

import { railwayGraphql, type RailwayAuth } from "./railwayGraphql";

/** Код опубликованного шаблона площадки */
export const SITE_TEMPLATE_CODE = "tbb-site";

/** Регион по умолчанию: Амстердам, рядом с серверами Telegram */
export const DEFAULT_SITE_REGION = "europe-west4-drams3a";

/** Имена сервисов площадки в шаблоне */
export const SITE_SERVICES = { runner: "Runner", redis: "Redis", postgres: "Postgres" } as const;

/** Сервис в конфигурации шаблона (только используемые поля) */
interface TemplateService {
  /** Имя сервиса */
  name: string;
  /** Источник: образ */
  source?: { image?: string };
  /** Настройки развёртывания */
  deploy?: Record<string, unknown>;
  /** Остальные поля шаблона передаются без изменений */
  [key: string]: unknown;
}

/** Конфигурация шаблона Railway */
export interface SiteTemplateConfig {
  /** Сервисы по ID внутри шаблона */
  services: Record<string, TemplateService>;
  /** Остальные поля шаблона */
  [key: string]: unknown;
}

/** Шаблон площадки */
export interface SiteTemplate {
  /** ID шаблона */
  id: string;
  /** Конфигурация сервисов */
  config: SiteTemplateConfig;
}

/** Что поменять в шаблоне */
export interface SiteTemplateOverrides {
  /** Регион всех сервисов */
  region: string;
  /** Образ исполнителя вместо образа из шаблона */
  runnerImage?: string;
}

/**
 * Загружает шаблон площадки
 * @param auth - Токен пользователя
 * @param code - Код шаблона
 * @returns ID и конфигурация шаблона
 */
export async function fetchSiteTemplate(auth: RailwayAuth, code = SITE_TEMPLATE_CODE): Promise<SiteTemplate> {
  const data = await railwayGraphql<{ template: { id: string; serializedConfig: SiteTemplateConfig } }>(
    auth,
    "query($code: String!) { template(code: $code) { id serializedConfig } }",
    { code },
  );
  return { id: data.template.id, config: data.template.serializedConfig };
}

/**
 * Подставляет регион и образ исполнителя, не меняя исходную конфигурацию
 * @param config - Конфигурация шаблона
 * @param overrides - Регион и образ
 * @returns новая конфигурация
 * @throws Error, если в шаблоне нет сервиса исполнителя
 */
export function prepareSiteTemplateConfig(config: SiteTemplateConfig, overrides: SiteTemplateOverrides): SiteTemplateConfig {
  const services = Object.fromEntries(
    Object.entries(config.services).map(([id, service]) => {
      const next: TemplateService = {
        ...service,
        deploy: { ...service.deploy, region: overrides.region, multiRegionConfig: { [overrides.region]: { numReplicas: 1 } } },
      };
      if (service.name === SITE_SERVICES.runner && overrides.runnerImage) next.source = { ...service.source, image: overrides.runnerImage };
      return [id, next];
    }),
  );
  if (!Object.values(services).some((s) => s.name === SITE_SERVICES.runner)) {
    throw new Error(`В шаблоне нет сервиса ${SITE_SERVICES.runner}`);
  }
  return { ...config, services };
}
