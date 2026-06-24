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
 * @returns Обновлённый проект с валидацией или ошибка
 */
export function addSheetToProject(
  projectJson: unknown,
  name?: string,
): MutateProjectResult | { error: string } {
  const project = parseProject(projectJson);
  if (!project) return { error: 'Невалидный project_json' };

  const sheets = [...(project.sheets ?? [])] as SheetLike[];
  const newId = nanoid();
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
