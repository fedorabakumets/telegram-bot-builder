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
    if (error instanceof RailwayApiError && error.reasons.some((r) => /not authorized/i.test(r))) {
      return { tokenKind: "workspace" };
    }
    throw error;
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
