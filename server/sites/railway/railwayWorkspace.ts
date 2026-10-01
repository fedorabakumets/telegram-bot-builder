/**
 * @fileoverview Выбор workspace Railway для новой площадки по токену пользователя.
 * Токен аккаунта видит свои workspace через `me`; токен workspace на `me` получает
 * «Not Authorized», но создаёт проекты в своём workspace без явного ID.
 * @module server/sites/railway/railwayWorkspace
 */

import { RailwayApiError, railwayGraphql, type RailwayAuth } from "./railwayGraphql";

/** Workspace Railway */
export interface RailwayWorkspace {
  /** ID workspace */
  id: string;
  /** Название */
  name: string;
}

/** Куда создавать проект площадки */
export interface RailwayTarget {
  /** Тип токена: "account" — токен аккаунта, "workspace" — токен workspace */
  tokenKind: "account" | "workspace";
  /** ID workspace; у токена workspace не нужен */
  workspaceId?: string;
}

/**
 * Проверяет, что Railway отказал в доступе
 * @param error - Ошибка запроса
 * @returns true для «Not Authorized»
 */
function isNotAuthorized(error: unknown): boolean {
  return error instanceof RailwayApiError && error.reasons.some((r) => /not authorized/i.test(r));
}

/**
 * Определяет тип токена и workspace для площадки
 * @param auth - Токен пользователя
 * @param wantedWorkspaceId - Нужный workspace, если у аккаунта их несколько
 * @returns куда создавать проект
 * @throws Error, если у аккаунта несколько workspace и нужный не указан или не найден
 */
export async function resolveRailwayTarget(auth: RailwayAuth, wantedWorkspaceId?: string): Promise<RailwayTarget> {
  let workspaces: RailwayWorkspace[];
  try {
    const data = await railwayGraphql<{ me: { workspaces: RailwayWorkspace[] } }>(auth, "query { me { workspaces { id name } } }");
    workspaces = data.me.workspaces;
  } catch (error) {
    if (!isNotAuthorized(error)) throw error;
    // Неизвестный токен Railway считает анонимом и создаёт ему временные проекты, поэтому
    // токен workspace подтверждаем запросом проектов: аноним его не проходит
    try {
      await railwayGraphql(auth, "query { projects(first: 1) { edges { node { id } } } }");
    } catch (inner) {
      if (isNotAuthorized(inner)) throw new Error("Токен Railway не подходит: нужен токен аккаунта или workspace");
      throw inner;
    }
    return { tokenKind: "workspace" };
  }
  if (wantedWorkspaceId) {
    if (!workspaces.some((w) => w.id === wantedWorkspaceId)) {
      throw new Error(`Workspace ${wantedWorkspaceId} не найден у этого токена`);
    }
    return { tokenKind: "account", workspaceId: wantedWorkspaceId };
  }
  if (workspaces.length === 1) return { tokenKind: "account", workspaceId: workspaces[0].id };
  const list = workspaces.map((w) => `${w.id} (${w.name})`).join(", ");
  throw new Error(workspaces.length === 0 ? "У аккаунта нет workspace" : `Укажите workspace: ${list}`);
}
