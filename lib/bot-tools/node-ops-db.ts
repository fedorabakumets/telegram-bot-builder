/**
 * @fileoverview Node-level операции над живой БД запущенного приложения (live-редактирование)
 * @description Каждая функция читает актуальный проект из БД через GET /api/projects/:id,
 * применяет ОДНУ node-операцию из project-mutate.ts и при успехе пишет результат обратно
 * через updateProjectInDb (PUT с agentEdit:true, сервер вещает правку на открытый холст).
 * При ошибке операции запись в БД не выполняется.
 * @module lib/bot-tools/node-ops-db
 */

import type { Node } from '@shared/schema';
import {
  addNodeToProject,
  updateNodeInProject,
  removeNodeFromProject,
  connectNodes,
  disconnectNodes,
  duplicateNodeInProject,
  moveNodeToProjectSheet,
  autoLayoutSheetInProject,
  type ConnectPortType,
  type MutateProjectResult,
} from './project-mutate.ts';
import {
  updateProjectInDb,
  type UpdateProjectInDbOptions,
  type UpdateProjectInDbResult,
} from './project-db.ts';
import { fetchProjectFromDb } from './project-db-read.ts';

/** Опции node-level операций над живой БД */
export type NodeOpsDbOptions = UpdateProjectInDbOptions;

/** Объединённый тип результата node-level операции над БД */
export type NodeOpsDbResult = UpdateProjectInDbResult | { error: string };

/**
 * Применяет результат node-операции и при успехе пишет проект в БД.
 * Если node-операция вернула ошибку — запись в БД не выполняется.
 * @param projectId - Числовой ID проекта
 * @param mutateResult - Результат node-операции из project-mutate.ts
 * @param options - Опции записи в БД
 * @returns Результат записи или ошибка node-операции
 */
async function applyAndSave(
  projectId: number,
  mutateResult: MutateProjectResult | { error: string },
  options?: NodeOpsDbOptions,
): Promise<NodeOpsDbResult> {
  if ('error' in mutateResult) return { error: mutateResult.error };
  return updateProjectInDb(projectId, mutateResult.project, options);
}

/**
 * Добавляет ноду в проект живой БД и обновляет холст (live).
 * @param projectId - Числовой ID проекта
 * @param node - Нода для добавления
 * @param sheetId - ID листа (опционально)
 * @param options - Опции записи в БД
 * @returns Результат записи или ошибка
 */
export async function addNodeInDb(
  projectId: number,
  node: Node,
  sheetId?: string,
  options?: NodeOpsDbOptions,
): Promise<NodeOpsDbResult> {
  const fetched = await fetchProjectFromDb(projectId, options);
  if ('error' in fetched) return fetched;
  return applyAndSave(projectId, addNodeToProject(fetched.data, node, sheetId), options);
}

/**
 * Обновляет ноду по id в проекте живой БД и обновляет холст (live).
 * @param projectId - Числовой ID проекта
 * @param nodeId - ID ноды
 * @param patch - Частичное обновление ноды { type?, position?, data? }
 * @param sheetId - ID листа (опционально)
 * @param options - Опции записи в БД
 * @returns Результат записи или ошибка
 */
export async function updateNodeInDb(
  projectId: number,
  nodeId: string,
  patch: { type?: Node['type']; position?: Node['position']; data?: Partial<Node['data']> },
  sheetId?: string,
  options?: NodeOpsDbOptions,
): Promise<NodeOpsDbResult> {
  const fetched = await fetchProjectFromDb(projectId, options);
  if ('error' in fetched) return fetched;
  return applyAndSave(projectId, updateNodeInProject(fetched.data, nodeId, patch, sheetId), options);
}

/**
 * Удаляет ноду из проекта живой БД и обновляет холст (live).
 * @param projectId - Числовой ID проекта
 * @param nodeId - ID ноды
 * @param sheetId - ID листа (опционально)
 * @param options - Опции записи в БД
 * @returns Результат записи или ошибка
 */
export async function removeNodeInDb(
  projectId: number,
  nodeId: string,
  sheetId?: string,
  options?: NodeOpsDbOptions,
): Promise<NodeOpsDbResult> {
  const fetched = await fetchProjectFromDb(projectId, options);
  if ('error' in fetched) return fetched;
  return applyAndSave(projectId, removeNodeFromProject(fetched.data, nodeId, sheetId), options);
}

/**
 * Соединяет две ноды в проекте живой БД и обновляет холст (live).
 * @param projectId - Числовой ID проекта
 * @param fromId - ID исходной ноды
 * @param toId - ID целевой ноды
 * @param connectOptions - Параметры соединения { branch?, portType?, sheetId? }
 * @param options - Опции записи в БД
 * @returns Результат записи или ошибка
 */
export async function connectNodesInDb(
  projectId: number,
  fromId: string,
  toId: string,
  connectOptions?: { branch?: string; portType?: ConnectPortType; sheetId?: string },
  options?: NodeOpsDbOptions,
): Promise<NodeOpsDbResult> {
  const fetched = await fetchProjectFromDb(projectId, options);
  if ('error' in fetched) return fetched;
  return applyAndSave(projectId, connectNodes(fetched.data, fromId, toId, connectOptions ?? {}), options);
}

/**
 * Снимает переход между нодами в проекте живой БД и обновляет холст (live).
 * Без branch снимает все рёбра from→to; с branch — только указанную кнопку/ветку.
 * @param projectId - Числовой ID проекта
 * @param fromId - ID исходной ноды
 * @param toId - ID целевой ноды
 * @param disconnectOptions - Параметры снятия { branch?, portType?, sheetId? }
 * @param options - Опции записи в БД
 * @returns Результат записи или ошибка
 */
export async function disconnectNodesInDb(
  projectId: number,
  fromId: string,
  toId: string,
  disconnectOptions?: { branch?: string; portType?: ConnectPortType; sheetId?: string },
  options?: NodeOpsDbOptions,
): Promise<NodeOpsDbResult> {
  const fetched = await fetchProjectFromDb(projectId, options);
  if ('error' in fetched) return fetched;
  return applyAndSave(projectId, disconnectNodes(fetched.data, fromId, toId, disconnectOptions ?? {}), options);
}

/**
 * Дублирует ноду на том же листе в проекте живой БД и обновляет холст (live).
 * Копия получает новый id (_copy_<ts>_<rand>) и смещённую позицию; исходящие
 * ссылки сохраняются как у оригинала. Один PUT = одна версия в истории.
 * @param projectId - Числовой ID проекта
 * @param nodeId - ID дублируемой ноды
 * @param dupOptions - Опции { position? (позиция копии), sheetId? (лист) }
 * @param options - Опции записи в БД
 * @returns Результат записи с newNodeId или ошибка
 */
export async function duplicateNodeInDb(
  projectId: number,
  nodeId: string,
  dupOptions?: { position?: { x: number; y: number }; sheetId?: string },
  options?: NodeOpsDbOptions,
): Promise<NodeOpsDbResult> {
  const fetched = await fetchProjectFromDb(projectId, options);
  if ('error' in fetched) return fetched;
  const mutated = duplicateNodeInProject(fetched.data, nodeId, dupOptions);
  if ('error' in mutated) return { error: mutated.error };
  const saved = await updateProjectInDb(projectId, mutated.project, options);
  if ('error' in saved) return saved;
  return { ...saved, newNodeId: mutated.newNodeId } as NodeOpsDbResult;
}

/**
 * Переносит ноду на другой лист проекта в живой БД и обновляет холст (live).
 * id и связи ноды сохраняются (target'ы не ремаппятся). Один PUT = одна версия в истории.
 * @param projectId - Числовой ID проекта
 * @param nodeId - ID переносимой ноды
 * @param toSheetId - ID целевого листа
 * @param moveOptions - Опции переноса { fromSheetId? (иначе автопоиск), position? (новая позиция) }
 * @param options - Опции записи в БД
 * @returns Результат записи или ошибка
 */
export async function moveNodeInDb(
  projectId: number,
  nodeId: string,
  toSheetId: string,
  moveOptions?: { fromSheetId?: string; position?: { x: number; y: number } },
  options?: NodeOpsDbOptions,
): Promise<NodeOpsDbResult> {
  const fetched = await fetchProjectFromDb(projectId, options);
  if ('error' in fetched) return fetched;
  return applyAndSave(projectId, moveNodeToProjectSheet(fetched.data, nodeId, toSheetId, moveOptions), options);
}

/**
 * Пересчитывает позиции всех нод листа иерархической авто-раскладкой в живой БД
 * и обновляет холст (live). Меняет только координаты нод; data, связи и листы
 * не затрагиваются. Один PUT = одна версия в истории.
 * @param projectId - Числовой ID проекта
 * @param sheetId - ID листа (опционально; по умолчанию активный/первый)
 * @param options - Опции записи в БД
 * @returns Результат записи или ошибка (пустой/несуществующий лист)
 */
export async function autoLayoutSheetInDb(
  projectId: number,
  sheetId?: string,
  options?: NodeOpsDbOptions,
): Promise<NodeOpsDbResult> {
  const fetched = await fetchProjectFromDb(projectId, options);
  if ('error' in fetched) return fetched;
  return applyAndSave(projectId, autoLayoutSheetInProject(fetched.data, sheetId), options);
}
