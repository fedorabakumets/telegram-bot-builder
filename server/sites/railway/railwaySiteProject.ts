/**
 * @fileoverview Проект площадки в аккаунте Railway пользователя: создание, развёртывание
 * шаблона, ожидание сервисов, чтение переменных и удаление.
 * @module server/sites/railway/railwaySiteProject
 */

import { railwayGraphql, type RailwayAuth } from "./railwayGraphql";
import type { SiteTemplate, SiteTemplateConfig } from "./siteTemplateConfig";
import type { RailwayTarget } from "./railwayWorkspace";

/** Проект и окружение площадки */
export interface RailwaySiteProject {
  /** ID проекта */
  projectId: string;
  /** ID окружения production */
  environmentId: string;
}

/** Статусы деплоя, после которых сервис уже не поднимется сам */
const FAILED_STATUSES = new Set(["FAILED", "CRASHED", "REMOVED", "SKIPPED"]);

/**
 * Создаёт пустой проект площадки
 * @param auth - Токен пользователя
 * @param target - Workspace
 * @param name - Имя проекта
 * @returns ID проекта и окружения
 */
export async function createSiteProject(auth: RailwayAuth, target: RailwayTarget, name: string): Promise<RailwaySiteProject> {
  const data = await railwayGraphql<{ projectCreate: { id: string; environments: { edges: { node: { id: string } }[] } } }>(
    auth,
    "mutation($input: ProjectCreateInput!) { projectCreate(input: $input) { id environments { edges { node { id } } } } }",
    { input: { name, defaultEnvironmentName: "production", ...(target.workspaceId ? { workspaceId: target.workspaceId } : {}) } },
  );
  const environmentId = data.projectCreate.environments.edges[0]?.node.id;
  if (!environmentId) throw new Error("Railway создал проект без окружения");
  return { projectId: data.projectCreate.id, environmentId };
}

/**
 * Разворачивает шаблон в проекте площадки
 * @param auth - Токен пользователя
 * @param project - Проект площадки
 * @param template - Шаблон
 * @param config - Подготовленная конфигурация шаблона
 */
export async function deploySiteTemplate(auth: RailwayAuth, project: RailwaySiteProject, template: SiteTemplate, config: SiteTemplateConfig): Promise<void> {
  await railwayGraphql(
    auth,
    "mutation($input: TemplateDeployV2Input!) { templateDeployV2(input: $input) { projectId } }",
    { input: { templateId: template.id, projectId: project.projectId, environmentId: project.environmentId, serializedConfig: config } },
  );
}

/**
 * Сервисы проекта по имени
 * @param auth - Токен пользователя
 * @param projectId - ID проекта
 * @returns имя сервиса → ID
 */
export async function listSiteServices(auth: RailwayAuth, projectId: string): Promise<Map<string, string>> {
  const data = await railwayGraphql<{ project: { services: { edges: { node: { id: string; name: string } }[] } } }>(
    auth,
    "query($id: String!) { project(id: $id) { services { edges { node { id name } } } } }",
    { id: projectId },
  );
  return new Map(data.project.services.edges.map((e) => [e.node.name, e.node.id]));
}

/**
 * Последний статус деплоя каждого сервиса проекта
 * @param auth - Токен пользователя
 * @param project - Проект площадки
 * @returns ID сервиса → статус последнего деплоя
 */
export async function latestSiteDeployments(auth: RailwayAuth, project: RailwaySiteProject): Promise<Map<string, string>> {
  const data = await railwayGraphql<{ deployments: { edges: { node: { serviceId: string; status: string } }[] } }>(
    auth,
    "query($input: DeploymentListInput!) { deployments(first: 30, input: $input) { edges { node { serviceId status } } } }",
    { input: { projectId: project.projectId, environmentId: project.environmentId } },
  );
  const latest = new Map<string, string>();
  for (const { node } of data.deployments.edges) if (!latest.has(node.serviceId)) latest.set(node.serviceId, node.status);
  return latest;
}

/**
 * Проверяет, что сервис не упал окончательно
 * @param status - Статус деплоя
 * @returns true, если деплой завершился ошибкой
 */
export function isFailedDeployment(status: string): boolean {
  return FAILED_STATUSES.has(status);
}

/**
 * Готовые значения переменных сервиса (ссылки раскрыты)
 * @param auth - Токен пользователя
 * @param project - Проект площадки
 * @param serviceId - ID сервиса
 * @returns переменные сервиса
 */
export async function siteServiceVariables(auth: RailwayAuth, project: RailwaySiteProject, serviceId: string): Promise<Record<string, string>> {
  const data = await railwayGraphql<{ variables: Record<string, string> }>(
    auth,
    "query($p: String!, $e: String!, $s: String!) { variables(projectId: $p, environmentId: $e, serviceId: $s) }",
    { p: project.projectId, e: project.environmentId, s: serviceId },
  );
  return data.variables;
}

/**
 * Удаляет проект площадки вместе с сервисами и томами
 * @param auth - Токен пользователя
 * @param projectId - ID проекта
 */
export async function deleteSiteProject(auth: RailwayAuth, projectId: string): Promise<void> {
  await railwayGraphql(auth, "mutation($id: String!) { projectDelete(id: $id) }", { id: projectId });
}
