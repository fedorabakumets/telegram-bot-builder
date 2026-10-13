/**
 * @fileoverview MCP-обёртки анализа и массовой правки навигации сценария
 * @module lib/bot-tools/scenario-navigation-db
 */

import { fetchProjectFromDb } from './project-db-read.ts';
import { updateProjectInDb, type UpdateProjectInDbOptions } from './project-db.ts';
import {
  findInboundReferences,
  reportButtonNavigation,
  rewriteButtonNavigation,
} from './scenario-navigation.ts';

/** Опции чтения и записи навигации */
export interface NavigationDbOptions extends UpdateProjectInDbOptions {
  /** Ограничить анализ или изменение одним листом */
  sheetId?: string;
}

/**
 * Находит все входящие ссылки на ноду в живом проекте.
 * @param projectId - Числовой ID проекта
 * @param nodeId - ID целевой ноды
 * @param options - Опции доступа к API
 * @returns Целевая нода и входящие ссылки либо ошибка
 */
export async function findInboundReferencesInDb(
  projectId: number,
  nodeId: string,
  options?: NavigationDbOptions,
) {
  const fetched = await fetchProjectFromDb(projectId, options);
  if ('error' in fetched) return fetched;
  return findInboundReferences(fetched.data as unknown as Record<string, unknown>, nodeId);
}

/**
 * Формирует отчёт о поведении кнопок живого проекта.
 * @param projectId - Числовой ID проекта
 * @param options - Опции доступа и фильтр листа
 * @returns Отчёт по кнопкам либо ошибка
 */
export async function reportButtonNavigationInDb(projectId: number, options?: NavigationDbOptions) {
  const fetched = await fetchProjectFromDb(projectId, options);
  if ('error' in fetched) return fetched;
  return reportButtonNavigation(fetched.data as unknown as Record<string, unknown>, options?.sheetId);
}

/**
 * Строит план или применяет массовую правку кнопочной навигации.
 * Без confirm выполняет только GET и возвращает план; PUT не вызывается.
 * @param projectId - Числовой ID проекта
 * @param mode - Режим навигации
 * @param confirm - Разрешение на запись
 * @param options - Опции записи и фильтр листа
 * @returns План и признак применения либо ошибка
 */
export async function rewriteButtonNavigationInDb(
  projectId: number,
  mode: 'edit_current' | 'send_new',
  confirm: boolean,
  options?: NavigationDbOptions,
) {
  const fetched = await fetchProjectFromDb(projectId, options);
  if ('error' in fetched) return fetched;
  const result = rewriteButtonNavigation(fetched.data, mode, options?.sheetId);
  if (!confirm || result.plan.changed === 0) {
    return { applied: false, requiresConfirmation: !confirm && result.plan.changed > 0, ...result.plan };
  }
  const written = await updateProjectInDb(projectId, result.project, options);
  if ('error' in written) return { ...written, plan: result.plan };
  return { applied: true, ...result.plan };
}
