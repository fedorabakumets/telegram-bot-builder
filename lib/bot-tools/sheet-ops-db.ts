/**
 * @fileoverview Sheet-level операции над живой БД запущенного приложения (live-редактирование)
 * @description Каждая функция читает актуальный проект из БД через GET /api/projects/:id,
 * применяет ОДНУ sheet-операцию из sheet-ops.ts и при успехе пишет результат обратно
 * через updateProjectInDb (PUT с agentEdit:true, сервер вещает правку на открытый холст).
 * При ошибке операции запись в БД не выполняется. listSheetsInDb — read-only.
 * @module lib/bot-tools/sheet-ops-db
 */

import { fetchProjectFromDb } from './project-db-read.ts';
import {
  updateProjectInDb,
  type UpdateProjectInDbOptions,
  type UpdateProjectInDbResult,
} from './project-db.ts';
import {
  addSheetToProject,
  renameSheetInProject,
  removeSheetFromProject,
  setActiveSheetInProject,
  listSheets,
  type ListSheetsResult,
} from './sheet-ops.ts';
import type { MutateProjectResult } from './project-mutate.ts';

/** Опции sheet-level операций над живой БД */
export type SheetOpsDbOptions = UpdateProjectInDbOptions;

/** Объединённый тип результата sheet-level операции над БД */
export type SheetOpsDbResult = UpdateProjectInDbResult | { error: string };

/**
 * Применяет результат sheet-операции и при успехе пишет проект в БД.
 * Если sheet-операция вернула ошибку — запись в БД не выполняется.
 * @param projectId - Числовой ID проекта
 * @param mutateResult - Результат sheet-операции из sheet-ops.ts
 * @param options - Опции записи в БД
 * @returns Результат записи или ошибка sheet-операции
 */
async function applyAndSave(
  projectId: number,
  mutateResult: MutateProjectResult | { error: string },
  options?: SheetOpsDbOptions,
): Promise<SheetOpsDbResult> {
  if ('error' in mutateResult) return { error: mutateResult.error };
  return updateProjectInDb(projectId, mutateResult.project, options);
}

/**
 * Добавляет лист в проект живой БД и обновляет холст (live).
 * @param projectId - Числовой ID проекта
 * @param name - Имя листа (опционально)
 * @param options - Опции записи в БД
 * @returns Результат записи или ошибка
 */
export async function addSheetInDb(
  projectId: number,
  name?: string,
  options?: SheetOpsDbOptions,
): Promise<SheetOpsDbResult> {
  const fetched = await fetchProjectFromDb(projectId, options);
  if ('error' in fetched) return fetched;
  return applyAndSave(projectId, addSheetToProject(fetched.data, name), options);
}

/**
 * Переименовывает лист по id в проекте живой БД и обновляет холст (live).
 * @param projectId - Числовой ID проекта
 * @param sheetId - ID листа
 * @param newName - Новое имя листа
 * @param options - Опции записи в БД
 * @returns Результат записи или ошибка
 */
export async function renameSheetInDb(
  projectId: number,
  sheetId: string,
  newName: string,
  options?: SheetOpsDbOptions,
): Promise<SheetOpsDbResult> {
  const fetched = await fetchProjectFromDb(projectId, options);
  if ('error' in fetched) return fetched;
  return applyAndSave(projectId, renameSheetInProject(fetched.data, sheetId, newName), options);
}

/**
 * Удаляет лист по id из проекта живой БД и обновляет холст (live).
 * @param projectId - Числовой ID проекта
 * @param sheetId - ID удаляемого листа
 * @param options - Опции записи в БД
 * @returns Результат записи или ошибка
 */
export async function removeSheetInDb(
  projectId: number,
  sheetId: string,
  options?: SheetOpsDbOptions,
): Promise<SheetOpsDbResult> {
  const fetched = await fetchProjectFromDb(projectId, options);
  if ('error' in fetched) return fetched;
  return applyAndSave(projectId, removeSheetFromProject(fetched.data, sheetId), options);
}

/**
 * Делает указанный лист активным в проекте живой БД и обновляет холст (live).
 * @param projectId - Числовой ID проекта
 * @param sheetId - ID листа
 * @param options - Опции записи в БД
 * @returns Результат записи или ошибка
 */
export async function setActiveSheetInDb(
  projectId: number,
  sheetId: string,
  options?: SheetOpsDbOptions,
): Promise<SheetOpsDbResult> {
  const fetched = await fetchProjectFromDb(projectId, options);
  if ('error' in fetched) return fetched;
  return applyAndSave(projectId, setActiveSheetInProject(fetched.data, sheetId), options);
}

/**
 * Возвращает read-only список листов проекта из живой БД (id, name, nodeCount).
 * @param projectId - Числовой ID проекта
 * @param options - Опции чтения (URL API)
 * @returns Список листов или ошибка
 */
export async function listSheetsInDb(
  projectId: number,
  options?: SheetOpsDbOptions,
): Promise<ListSheetsResult | { error: string }> {
  const fetched = await fetchProjectFromDb(projectId, options);
  if ('error' in fetched) return fetched;
  return listSheets(fetched.data);
}
