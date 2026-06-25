/**
 * @fileoverview Чистый перенос листа между двумя проектами (move/copy)
 * @description Функция moveSheetBetweenProjects берёт лист исходного проекта,
 * СОХРАНЯЕТ оригинальные id нод/веток и связи между ними, перегенерируя id только
 * при реальной коллизии с id, уже существующими в целевом проекте (тогда же
 * ремаппит затронутые ссылки). Кросс-листовые ссылки (на ноды других листов
 * исходного проекта, которых не будет в целевом) обрываются. Готовый лист
 * добавляется в целевой проект и становится там активным. В режиме move лист
 * также удаляется из исходного проекта, а в оставшихся листах источника
 * обрываются ссылки на ноды унесённого листа. Функция чистая: не мутирует вход.
 *
 * Это «профессиональный» аналог наивной UI-функции «Переместить в другой проект»,
 * которая копировала лист JSON-клоном без какого-либо контроля коллизий id.
 * @module lib/bot-tools/sheet-move-ops
 */

import { nanoid } from 'nanoid';
import type { BotDataWithSheets } from '@shared/schema';
import { validateBotProject } from './validate-project.ts';
import type { ValidateProjectResult } from './types.ts';
import { updateNodeReferencesInData } from './sheet-node-references.ts';
import { clearExternalNodeReferences } from './clear-external-references.ts';

/** Режим переноса листа между проектами */
export type MoveSheetMode = 'move' | 'copy';

/** Лёгкий лист в массиве sheets */
interface SheetLike {
  /** Идентификатор листа */
  id: string;
  /** Название листа */
  name: string;
  /** Узлы листа */
  nodes?: any[];
  /** Состояние вьюпорта листа */
  viewState?: unknown;
}

/** Успешный результат переноса листа между проектами */
export interface MoveSheetBetweenProjectsResult {
  /** Обновлённый исходный проект (без листа в режиме move; без изменений в copy) */
  source: BotDataWithSheets;
  /** Обновлённый целевой проект (с добавленным листом) */
  target: BotDataWithSheets;
  /** id листа в целевом проекте (новый) */
  newSheetId: string;
  /** Имя добавленного листа в целевом проекте */
  newSheetName: string;
  /** Валидация исходного проекта после операции */
  sourceValidation: ValidateProjectResult;
  /** Валидация целевого проекта после операции */
  targetValidation: ValidateProjectResult;
}

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

/**
 * Генерирует новый уникальный id ноды на основе существующего: срезает прежние
 * суффиксы копирования (_paste_/_copy_/_dup_/_move_) и добавляет свежий
 * _move_<ts>_<rand>. Применяется ТОЛЬКО при коллизии id с целевым проектом.
 * @param id - Исходный id ноды
 * @returns Новый уникальный id с суффиксом _move_
 */
function generateMovedNodeId(id: string): string {
  const baseId = id.replace(
    /(_paste_\d+_[a-z0-9]+|_copy_\d+_[a-z0-9]+|_copy_\d+|_dup_\d+_[a-z0-9]+|_move_\d+_[a-z0-9]+)+$/,
    '',
  );
  return `${baseId}_move_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Собирает все id нод проекта во множество (по всем листам).
 * @param project - Проект
 * @returns Множество id нод
 */
function collectNodeIds(project: BotDataWithSheets): Set<string> {
  const ids = new Set<string>();
  for (const sheet of (project.sheets ?? []) as SheetLike[]) {
    for (const node of sheet.nodes ?? []) ids.add(node.id);
  }
  return ids;
}

/**
 * Собирает все id веток (data.branches[].id) проекта во множество (по всем листам).
 * @param project - Проект
 * @returns Множество id веток
 */
function collectBranchIds(project: BotDataWithSheets): Set<string> {
  const ids = new Set<string>();
  for (const sheet of (project.sheets ?? []) as SheetLike[]) {
    for (const node of sheet.nodes ?? []) {
      const branches = (node.data as any)?.branches;
      if (Array.isArray(branches)) {
        for (const branch of branches) if (branch?.id) ids.add(branch.id);
      }
    }
  }
  return ids;
}

/**
 * Ремаппит ноды листа с СОХРАНЕНИЕМ оригинальных id и связей. Новый id (с суффиксом
 * _move_) выдаётся ноде ТОЛЬКО при коллизии её id с id уже существующих нод целевого
 * проекта; ветке (branch.id) — только при коллизии с ветками целевого проекта. Все
 * затронутые ссылки ремаппятся, кросс-листовые ссылки (на ноды других листов
 * источника) обрываются. В обычном случае (id не пересекаются) связи остаются
 * буквально теми же.
 * @param originalNodes - Исходные ноды переносимого листа
 * @param targetNodeIds - Id нод, уже существующих в целевом проекте
 * @param targetBranchIds - Id веток, уже существующих в целевом проекте
 * @returns Готовые ноды для целевого проекта
 */
function remapSheetNodes(
  originalNodes: any[],
  targetNodeIds: Set<string>,
  targetBranchIds: Set<string>,
): any[] {
  // Шаг 1: id ноды меняется только при коллизии с целевым проектом
  const movedNodes = originalNodes.map((node) => ({
    ...node,
    id: targetNodeIds.has(node.id) ? generateMovedNodeId(node.id) : node.id,
  }));
  const nodeIdMap = new Map<string, string>(
    originalNodes.map((node, index) => [node.id, movedNodes[index].id]),
  );

  // Шаг 2: branch.id меняется только при коллизии с целевым проектом
  const branchIdMap = new Map<string, string>();
  const withBranches = movedNodes.map((node) => {
    const data = node.data as any;
    if (data?.branches && Array.isArray(data.branches)) {
      const updatedBranches = data.branches.map((branch: any) => {
        if (branch.id && targetBranchIds.has(branch.id)) {
          const newBranchId = nanoid();
          branchIdMap.set(branch.id, newBranchId);
          return { ...branch, id: newBranchId };
        }
        return branch;
      });
      return { ...node, data: { ...data, branches: updatedBranches } };
    }
    return node;
  });

  // Шаг 3: ремап condSourceId через branchIdMap
  const withCondSource = withBranches.map((node) => {
    const data = node.data as any;
    if (data?.condSourceId && branchIdMap.has(data.condSourceId)) {
      return { ...node, data: { ...data, condSourceId: branchIdMap.get(data.condSourceId) } };
    }
    return node;
  });

  // Шаг 4: ремап всех внутренних ссылок на ноды листа
  const withRefs = withCondSource.map((node) => ({
    ...node,
    data: updateNodeReferencesInData(node.data, nodeIdMap),
  }));

  // Шаг 5: обрыв кросс-листовых ссылок (на ноды других листов источника)
  const validIds = new Set<string>(movedNodes.map((n) => n.id));
  return withRefs.map((node) => ({
    ...node,
    data: clearExternalNodeReferences(node.data, validIds),
  }));
}

/**
 * Обрывает в листах источника ссылки на ноды, унесённые вместе с листом.
 * Применяется только в режиме move. validIds — все id нод, оставшихся в источнике;
 * любая ссылка на ноду вне этого набора (т.е. на унесённый лист) очищается.
 * @param remainingSheets - Листы источника после удаления переносимого
 * @returns Листы с очищенными висячими ссылками
 */
function clearDanglingRefsInSource(remainingSheets: SheetLike[]): SheetLike[] {
  const validIds = new Set<string>();
  for (const sheet of remainingSheets) {
    for (const node of sheet.nodes ?? []) validIds.add(node.id);
  }
  return remainingSheets.map((sheet) => ({
    ...sheet,
    nodes: (sheet.nodes ?? []).map((node: any) => ({
      ...node,
      data: clearExternalNodeReferences(node.data, validIds),
    })),
  }));
}

/**
 * Переносит лист из исходного проекта в целевой (move) или копирует (copy).
 * Оригинальные id нод/веток и связи между ними СОХРАНЯЮТСЯ; id перегенерируется
 * только при коллизии с целевым проектом (затронутые ссылки ремаппятся).
 * Кросс-листовые ссылки обрываются. Готовый лист добавляется в целевой проект и
 * становится там активным. В режиме move лист удаляется из источника (нельзя
 * унести последний), а оставшиеся листы источника очищаются от ссылок на
 * унесённые ноды.
 *
 * ⚠️ Лист в целевом проекте создаётся БЕЗ createdAt/updatedAt (z.date() в схеме
 * провалит валидацию после JSON round-trip GET→PUT).
 * @param sourceJson - project.json исходного проекта (объект или JSON-строка)
 * @param targetJson - project.json целевого проекта (объект или JSON-строка)
 * @param sheetId - ID переносимого листа в исходном проекте
 * @param mode - 'move' (перенос с удалением) или 'copy' (копирование)
 * @returns Результат с обоими проектами и валидацией или ошибка
 */
export function moveSheetBetweenProjects(
  sourceJson: unknown,
  targetJson: unknown,
  sheetId: string,
  mode: MoveSheetMode = 'copy',
): MoveSheetBetweenProjectsResult | { error: string } {
  const source = parseProject(sourceJson);
  if (!source) return { error: 'Невалидный source project_json' };
  const target = parseProject(targetJson);
  if (!target) return { error: 'Невалидный target project_json' };

  const sourceSheets = (source.sheets ?? []) as SheetLike[];
  const original = sourceSheets.find((s) => s.id === sheetId);
  if (!original) return { error: 'Лист не найден в исходном проекте' };

  if (mode === 'move' && sourceSheets.length <= 1) {
    return { error: 'Нельзя перенести последний лист из исходного проекта' };
  }

  // Готовим лист для целевого проекта (id сохраняются, перегенерация только при
  // коллизии с целевым проектом; обрыв кросс-листовых ссылок)
  const targetSheets = (target.sheets ?? []) as SheetLike[];
  const targetNodeIds = collectNodeIds(target);
  const targetBranchIds = collectBranchIds(target);
  const movedNodes = remapSheetNodes(
    (original.nodes ?? []) as any[],
    targetNodeIds,
    targetBranchIds,
  );
  const newSheetId = nanoid();
  const existingNames = new Set(targetSheets.map((s) => s.name));
  let newSheetName = original.name;
  while (existingNames.has(newSheetName)) {
    newSheetName = `${original.name} (перенесён)`;
    if (existingNames.has(newSheetName)) {
      newSheetName = `${original.name} (перенесён ${nanoid(4)})`;
    }
  }

  const newSheet = {
    id: newSheetId,
    name: newSheetName,
    nodes: movedNodes,
    viewState: { ...((original.viewState as any) ?? { pan: { x: 0, y: 0 }, zoom: 100 }) },
  };

  const updatedTarget = {
    ...target,
    sheets: [...targetSheets, newSheet],
    activeSheetId: newSheetId,
  } as BotDataWithSheets;

  // Источник: в режиме copy не меняется, в режиме move удаляем лист и чистим ссылки
  let updatedSource = source;
  if (mode === 'move') {
    const remaining = clearDanglingRefsInSource(
      sourceSheets.filter((s) => s.id !== sheetId),
    );
    let activeSheetId = source.activeSheetId;
    if (activeSheetId === sheetId) {
      activeSheetId = remaining[0]?.id;
    }
    updatedSource = { ...source, sheets: remaining, activeSheetId } as BotDataWithSheets;
  }

  return {
    source: updatedSource,
    target: updatedTarget,
    newSheetId,
    newSheetName,
    sourceValidation: validateBotProject(updatedSource),
    targetValidation: validateBotProject(updatedTarget),
  };
}
