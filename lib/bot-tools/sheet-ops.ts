/**
 * @fileoverview Sheet-level (листы) чистые in-memory мутации project.json
 * @description Набор чистых функций для управления листами холста: добавление,
 * переименование, удаление, выбор активного листа и read-only список листов.
 * Каждая мутация парсит project_json, выполняет операцию над массивом sheets и
 * возвращает результат с валидацией (MutateProjectResult) или ошибку. Db-обёртки
 * над этими функциями живут в sheet-ops-db.ts.
 *
 * ⚠️ Листы создаются БЕЗ полей createdAt/updatedAt: это z.date() в схеме, а после
 * JSON round-trip (GET→PUT) Date превращается в строку и проваливает валидацию
 * updateProjectInDb. Поэтому новый лист содержит только { id, name, nodes, viewState }.
 * @module lib/bot-tools/sheet-ops
 */

import { nanoid } from 'nanoid';
import type { BotDataWithSheets } from '@shared/schema';
import { validateBotProject } from './validate-project.ts';
import { updateNodeReferencesInData } from './sheet-node-references.ts';
import type { MutateProjectResult } from './project-mutate.ts';

/**
 * Парсит project_json в объект (строка → JSON.parse, объект → structuredClone)
 * @param input - Объект или JSON-строка
 * @returns project или null при невалидном вводе
 */
function parseProject(input: unknown): BotDataWithSheets | null {
  if (typeof input === 'string') {
    try {
      return JSON.parse(input) as BotDataWithSheets;
    } catch {
      return null;
    }
  }
  if (input && typeof input === 'object') return structuredClone(input) as BotDataWithSheets;
  return null;
}

/** Лёгкий лист в массиве sheets (для типобезопасного доступа к name) */
interface SheetLike {
  /** Идентификатор листа */
  id: string;
  /** Название листа */
  name: string;
  /** Узлы листа */
  nodes?: unknown[];
}

/**
 * Генерирует имя для нового листа: максимальный номер среди имён вида
 * "Лист N" плюс один, либо "Лист {count+1}" если совпадений нет.
 * @param sheets - Текущие листы проекта
 * @returns Имя нового листа
 */
function generateNextSheetName(sheets: SheetLike[]): string {
  let maxNum = 0;
  for (const sheet of sheets) {
    const match = /^Лист (\d+)$/.exec(sheet.name ?? '');
    if (match) {
      const num = Number(match[1]);
      if (num > maxNum) maxNum = num;
    }
  }
  if (maxNum > 0) return `Лист ${maxNum + 1}`;
  return `Лист ${sheets.length + 1}`;
}

/**
 * Добавляет новый пустой лист в проект и делает его активным.
 * @param projectJson - Текущий project.json
 * @param name - Имя листа (опционально; иначе генерируется "Лист N")
 * @param id - Явный id нового листа (опционально; иначе генерируется nanoid).
 *   Если передан и лист с таким id уже существует — возвращается ошибка.
 * @returns Обновлённый проект с валидацией или ошибка
 */
export function addSheetToProject(
  projectJson: unknown,
  name?: string,
  id?: string,
): MutateProjectResult | { error: string } {
  const project = parseProject(projectJson);
  if (!project) return { error: 'Невалидный project_json' };

  const sheets = [...(project.sheets ?? [])] as SheetLike[];
  if (id && sheets.some((s) => s.id === id)) {
    return { error: 'Лист с таким id уже существует' };
  }
  const newId = id ?? nanoid();
  const sheetName = name?.trim() || generateNextSheetName(sheets);

  const newSheet = {
    id: newId,
    name: sheetName,
    nodes: [],
    viewState: { pan: { x: 0, y: 0 }, zoom: 100 },
  };

  const updated = {
    ...project,
    sheets: [...(project.sheets ?? []), newSheet],
    activeSheetId: newId,
  } as BotDataWithSheets;

  return { project: updated, validation: validateBotProject(updated) };
}

/**
 * Генерирует новый уникальный id ноды на основе существующего: срезает прежние
 * суффиксы копирования (_paste_/_copy_/_dup_) и добавляет свежий _dup_<ts>_<rand>.
 * Аналог клиентского generateNewId(id, 'dup'), без внешних зависимостей.
 * @param id - Исходный id ноды
 * @returns Новый уникальный id с суффиксом _dup_
 */
function generateDuplicateSheetNodeId(id: string): string {
  const baseId = id.replace(
    /(_paste_\d+_[a-z0-9]+|_copy_\d+_[a-z0-9]+|_copy_\d+|_dup_\d+_[a-z0-9]+)+$/,
    '',
  );
  return `${baseId}_dup_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Дублирует целый лист со всеми нодами (иммутабельный порт клиентского
 * duplicateSheet под live-БД). Пошагово:
 * 1. Каждой ноде выдаётся новый id (_dup_) и позиция со смещением +50/+50,
 *    строится карта старый node.id → новый (nodeIdMap).
 * 2. Каждой ветке в data.branches выдаётся свежий nanoid(), строится branchIdMap.
 * 3. У нод с data.condSourceId, присутствующим в branchIdMap, ссылка ремаппится.
 * 4. Все ссылки на ноды внутри data ремаппятся через updateNodeReferencesInData.
 * 5. Создаётся новый лист "{name} (копия)" с новым id и копией viewState оригинала.
 *
 * ⚠️ Новый лист создаётся БЕЗ createdAt/updatedAt (z.date() в схеме провалит
 * валидацию после JSON round-trip GET→PUT). Лист становится активным.
 * @param projectJson - Текущий project.json (объект или JSON-строка)
 * @param sheetId - ID дублируемого листа
 * @returns Обновлённый проект с валидацией или ошибка
 */
export function duplicateSheetInProject(
  projectJson: unknown,
  sheetId: string,
): MutateProjectResult | { error: string } {
  const project = parseProject(projectJson);
  if (!project) return { error: 'Невалидный project_json' };

  const sheets = (project.sheets ?? []) as SheetLike[];
  const original = sheets.find((s) => s.id === sheetId);
  if (!original) return { error: 'Лист не найден' };

  const originalNodes = (original.nodes ?? []) as any[];

  // Шаг 1: новые id нод + смещение позиции, карта nodeIdMap
  const duplicatedNodes = originalNodes.map((node) => ({
    ...node,
    id: generateDuplicateSheetNodeId(node.id),
    position: {
      x: (node.position?.x ?? 0) + 50,
      y: (node.position?.y ?? 0) + 50,
    },
  }));
  const nodeIdMap = new Map<string, string>(
    originalNodes.map((node, index) => [node.id, duplicatedNodes[index].id]),
  );

  // Шаг 2: новые branch.id для нод с data.branches, карта branchIdMap
  const branchIdMap = new Map<string, string>();
  const nodesWithBranches = duplicatedNodes.map((node) => {
    const data = node.data as any;
    if (data?.branches && Array.isArray(data.branches)) {
      const updatedBranches = data.branches.map((branch: any) => {
        const newBranchId = nanoid();
        if (branch.id) branchIdMap.set(branch.id, newBranchId);
        return { ...branch, id: newBranchId };
      });
      return { ...node, data: { ...data, branches: updatedBranches } };
    }
    return node;
  });

  // Шаг 3: ремап condSourceId через branchIdMap
  const nodesWithCondSource = nodesWithBranches.map((node) => {
    const data = node.data as any;
    if (data?.condSourceId && branchIdMap.has(data.condSourceId)) {
      return { ...node, data: { ...data, condSourceId: branchIdMap.get(data.condSourceId) } };
    }
    return node;
  });

  // Шаг 4: ремап всех ссылок на ноды внутри data
  const finalNodes = nodesWithCondSource.map((node) => ({
    ...node,
    data: updateNodeReferencesInData(node.data, nodeIdMap),
  }));

  // Шаг 5: сборка нового листа (без createdAt/updatedAt)
  const newSheetId = nanoid();
  const newSheet = {
    id: newSheetId,
    name: `${original.name} (копия)`,
    nodes: finalNodes,
    viewState: { ...((original as any).viewState ?? { pan: { x: 0, y: 0 }, zoom: 100 }) },
  };

  const updated = {
    ...project,
    sheets: [...(project.sheets ?? []), newSheet],
    activeSheetId: newSheetId,
  } as BotDataWithSheets;

  return { project: updated, validation: validateBotProject(updated) };
}

/**
 * Переименовывает лист по id (createdAt/updatedAt не трогаются).
 * @param projectJson - Текущий project.json
 * @param sheetId - ID листа
 * @param newName - Новое имя листа
 * @returns Обновлённый проект с валидацией или ошибка
 */
export function renameSheetInProject(
  projectJson: unknown,
  sheetId: string,
  newName: string,
): MutateProjectResult | { error: string } {
  const project = parseProject(projectJson);
  if (!project) return { error: 'Невалидный project_json' };

  const sheets = (project.sheets ?? []) as SheetLike[];
  if (!sheets.some((s) => s.id === sheetId)) return { error: 'Лист не найден' };

  const updatedSheets = sheets.map((s) =>
    s.id === sheetId ? { ...s, name: newName } : s,
  );

  const updated = { ...project, sheets: updatedSheets } as BotDataWithSheets;
  return { project: updated, validation: validateBotProject(updated) };
}

/**
 * Удаляет лист по id. Нельзя удалить последний лист. Если удаляется активный
 * лист, активным становится сосед (как в клиентском deleteSheet): следующий по
 * индексу из исходного массива, иначе предыдущий.
 * @param projectJson - Текущий project.json
 * @param sheetId - ID удаляемого листа
 * @returns Обновлённый проект с валидацией или ошибка
 */
export function removeSheetFromProject(
  projectJson: unknown,
  sheetId: string,
): MutateProjectResult | { error: string } {
  const project = parseProject(projectJson);
  if (!project) return { error: 'Невалидный project_json' };

  const sheets = (project.sheets ?? []) as SheetLike[];
  const idx = sheets.findIndex((s) => s.id === sheetId);
  if (idx < 0) return { error: 'Лист не найден' };
  if (sheets.length <= 1) return { error: 'Нельзя удалить последний лист' };

  const remaining = sheets.filter((s) => s.id !== sheetId);

  let activeSheetId = project.activeSheetId;
  if (activeSheetId === sheetId) {
    const neighbor = idx < sheets.length - 1 ? sheets[idx + 1] : sheets[idx - 1];
    activeSheetId = neighbor.id;
  }

  const updated = { ...project, sheets: remaining, activeSheetId } as BotDataWithSheets;
  return { project: updated, validation: validateBotProject(updated) };
}

/**
 * Делает указанный лист активным.
 * @param projectJson - Текущий project.json
 * @param sheetId - ID листа
 * @returns Обновлённый проект с валидацией или ошибка
 */
export function setActiveSheetInProject(
  projectJson: unknown,
  sheetId: string,
): MutateProjectResult | { error: string } {
  const project = parseProject(projectJson);
  if (!project) return { error: 'Невалидный project_json' };

  const sheets = (project.sheets ?? []) as SheetLike[];
  if (!sheets.some((s) => s.id === sheetId)) return { error: 'Лист не найден' };

  const updated = { ...project, activeSheetId: sheetId } as BotDataWithSheets;
  return { project: updated, validation: validateBotProject(updated) };
}

/** Краткая информация об одном листе для read-only списка */
export interface SheetInfo {
  /** Идентификатор листа */
  id: string;
  /** Название листа */
  name: string;
  /** Число нод на листе */
  nodeCount: number;
}

/** Результат read-only списка листов */
export interface ListSheetsResult {
  /** Активный лист */
  activeSheetId?: string;
  /** Общее число листов */
  total: number;
  /** Краткая информация по каждому листу */
  sheets: SheetInfo[];
}

/**
 * Возвращает read-only список листов проекта с числом нод.
 * @param projectJson - Текущий project.json
 * @returns Список листов или ошибка при невалидном вводе
 */
export function listSheets(projectJson: unknown): ListSheetsResult | { error: string } {
  const project = parseProject(projectJson);
  if (!project) return { error: 'Невалидный project_json' };

  const sheets = (project.sheets ?? []) as SheetLike[];
  return {
    activeSheetId: project.activeSheetId,
    total: sheets.length,
    sheets: sheets.map((s) => ({
      id: s.id,
      name: s.name,
      nodeCount: (s.nodes ?? []).length,
    })),
  };
}
