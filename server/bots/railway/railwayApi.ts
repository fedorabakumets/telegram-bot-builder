/**
 * @fileoverview Минимальный клиент GraphQL API Railway для сервисов исполнителей:
 * найти или создать сервис на образе, задать переменные, развернуть и остановить.
 * @module server/bots/railway/railwayApi
 */

import { railwayGraphql } from "../../sites/railway/railwayGraphql";
import type { RailwayConfig } from "./railwayConfig";

/** Последний деплой сервиса */
export interface RailwayDeployment {
  /** ID деплоя */
  id: string;
  /** Статус: SUCCESS, DEPLOYING, BUILDING, CRASHED, REMOVED и т.д. */
  status: string;
}

/**
 * Выполняет запрос к API Railway
 * @param config - Настройки Railway
 * @param query - Текст GraphQL
 * @param variables - Переменные запроса
 * @returns поле data ответа
 * @throws Error при сетевой ошибке или ошибке GraphQL
 */
function railwayRequest<T>(config: RailwayConfig, query: string, variables: Record<string, unknown>): Promise<T> {
  return railwayGraphql<T>({ token: config.apiToken, projectToken: config.projectToken }, query, variables);
}

/**
 * Ищет сервис проекта по имени
 * @param config - Настройки Railway
 * @param name - Имя сервиса
 * @returns ID сервиса или null
 */
export async function findRailwayService(config: RailwayConfig, name: string): Promise<string | null> {
  const data = await railwayRequest<{ project: { services: { edges: { node: { id: string; name: string } }[] } } }>(
    config,
    "query($id: String!) { project(id: $id) { services { edges { node { id name } } } } }",
    { id: config.projectId },
  );
  return data.project.services.edges.find((edge) => edge.node.name === name)?.node.id ?? null;
}

/**
 * Создаёт пустой сервис без источника: Railway не разворачивает его, пока
 * не заданы образ и регион (updateRailwayService) и не вызван деплой
 * @param config - Настройки Railway
 * @param name - Имя сервиса
 * @returns ID сервиса
 */
export async function createRailwayService(config: RailwayConfig, name: string): Promise<string> {
  const data = await railwayRequest<{ serviceCreate: { id: string } }>(
    config,
    "mutation($input: ServiceCreateInput!) { serviceCreate(input: $input) { id } }",
    { input: { projectId: config.projectId, environmentId: config.environmentId, name } },
  );
  return data.serviceCreate.id;
}

/**
 * Обновляет образ, регион и переменные сервиса без отдельного деплоя
 * @param config - Настройки Railway
 * @param serviceId - ID сервиса
 * @param variables - Переменные сервиса
 */
export async function updateRailwayService(config: RailwayConfig, serviceId: string, variables: Record<string, string>): Promise<void> {
  const scope = { environmentId: config.environmentId, serviceId };
  await railwayRequest(
    config,
    "mutation($environmentId: String!, $serviceId: String!, $input: ServiceInstanceUpdateInput!) { serviceInstanceUpdate(environmentId: $environmentId, serviceId: $serviceId, input: $input) }",
    {
      ...scope,
      input: {
        source: { image: config.image },
        ...(config.region ? { multiRegionConfig: { [config.region]: { numReplicas: 1 } } } : {}),
      },
    },
  );
  await railwayRequest(
    config,
    "mutation($input: VariableCollectionUpsertInput!) { variableCollectionUpsert(input: $input) }",
    { input: { projectId: config.projectId, ...scope, variables, skipDeploys: true } },
  );
}

/**
 * Последний деплой сервиса
 * @param config - Настройки Railway
 * @param serviceId - ID сервиса
 * @returns деплой или null, если деплоев не было
 */
export async function latestRailwayDeployment(config: RailwayConfig, serviceId: string): Promise<RailwayDeployment | null> {
  const data = await railwayRequest<{ deployments: { edges: { node: RailwayDeployment }[] } }>(
    config,
    "query($input: DeploymentListInput!) { deployments(first: 1, input: $input) { edges { node { id status } } } }",
    { input: { serviceId, environmentId: config.environmentId } },
  );
  return data.deployments.edges[0]?.node ?? null;
}

/**
 * Запускает новый деплой сервиса
 * @param config - Настройки Railway
 * @param serviceId - ID сервиса
 */
export async function deployRailwayService(config: RailwayConfig, serviceId: string): Promise<void> {
  await railwayRequest(
    config,
    "mutation($environmentId: String!, $serviceId: String!) { serviceInstanceDeployV2(environmentId: $environmentId, serviceId: $serviceId) }",
    { environmentId: config.environmentId, serviceId },
  );
}

/**
 * Снимает деплой: контейнер останавливается и перестаёт тратить ресурсы, сервис остаётся.
 * deploymentStop для работающего деплоя Railway не принимает («not stoppable»).
 * @param config - Настройки Railway
 * @param deploymentId - ID деплоя
 */
export async function stopRailwayDeployment(config: RailwayConfig, deploymentId: string): Promise<void> {
  await railwayRequest(config, "mutation($id: String!) { deploymentRemove(id: $id) }", { id: deploymentId });
}
