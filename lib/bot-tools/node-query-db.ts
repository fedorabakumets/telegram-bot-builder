/**
 * @fileoverview Read-only запросы состояния проекта и нод из живой БД приложения
 * @description Лёгкие инструменты для ориентации агента в текущем сценарии без вытягивания
 * всего project.json: список нод с краткой сводкой, одна нода по id, агрегированная сводка
 * по листам/типам. Все функции читают актуальные данные через fetchProjectFromDb (GET /api/projects/:id).
 * @module lib/bot-tools/node-query-db
 */

import type { BotDataWithSheets } from '@shared/schema';
import { fetchProjectFromDb, type FetchProjectFromDbOptions } from './project-db-read.ts';

/** Опции read-запросов к живой БД */
export type ReadDbOptions = FetchProjectFromDbOptions;

/** Лёгкая нода в проекте — сырой объект ноды из листа */
interface RawNode {
  /** Идентификатор ноды */
  id?: string;
  /** Тип ноды */
  type?: string;
  /** Данные ноды */
  data?: Record<string, unknown>;
  /** Позиция на холсте */
  position?: { x: number; y: number };
}

/** Краткая сводка одной ноды (лёгкий ответ) */
export interface NodeSummary {
  /** Идентификатор ноды */
  id: string;
  /** Тип ноды */
  type: string;
  /** ID листа, на котором находится нода */
  sheetId: string;
  /** Короткое человекочитаемое описание (текст/команда/переменная) */
  summary: string;
}

/** Сводка по одному листу проекта */
export interface SheetSummary {
  /** ID листа */
  sheetId: string;
  /** Название листа */
  name: string;
  /** Число нод на листе */
  nodeCount: number;
  /** Счётчик нод по типам */
  typeCounts: Record<string, number>;
}

/**
 * Строит короткое описание ноды по типичным полям data
 * @param node - Сырой объект ноды
 * @returns Усечённая строка-сводка (до 60 символов)
 */
function buildSummary(node: RawNode): string {
  const d = node.data ?? {};
  const raw = d.messageText ?? d.command ?? d.inputPrompt ?? d.variable ?? d.label ?? '';
  const s = String(raw).replace(/\s+/g, ' ').trim();
  return s.length > 60 ? `${s.slice(0, 60)}…` : s;
}

/**
 * Выбирает листы проекта: один по sheetId или все
 * @param data - Данные проекта
 * @param sheetId - ID листа (опционально)
 * @returns Массив листов с сырыми нодами
 */
function selectSheets(data: BotDataWithSheets, sheetId?: string): Array<{ id: string; name: string; nodes: RawNode[] }> {
  const sheets = (data.sheets ?? []) as Array<{ id: string; name: string; nodes: RawNode[] }>;
  if (!sheetId) return sheets;
  return sheets.filter((s) => s.id === sheetId);
}

/**
 * Возвращает лёгкий список нод проекта из живой БД (id, type, лист, краткая сводка).
 * @param projectId - Числовой ID проекта из URL редактора
 * @param sheetId - ID листа (опционально; по умолчанию все листы)
 * @param options - Опции чтения (URL API)
 * @returns Список сводок нод или ошибка
 */
export async function listNodesInDb(
  projectId: number,
  sheetId?: string,
  options?: ReadDbOptions,
): Promise<{ activeSheetId?: string; total: number; nodes: NodeSummary[] } | { error: string }> {
  const fetched = await fetchProjectFromDb(projectId, options);
  if ('error' in fetched) return fetched;

  const nodes: NodeSummary[] = [];
  for (const sheet of selectSheets(fetched.data, sheetId)) {
    for (const node of sheet.nodes ?? []) {
      nodes.push({
        id: node.id ?? '',
        type: node.type ?? 'unknown',
        sheetId: sheet.id,
        summary: buildSummary(node),
      });
    }
  }

  return { activeSheetId: fetched.data.activeSheetId, total: nodes.length, nodes };
}

/**
 * Возвращает одну ноду целиком из живой БД по id.
 * @param projectId - Числовой ID проекта
 * @param nodeId - ID искомой ноды
 * @param sheetId - ID листа (опционально; по умолчанию поиск по всем листам)
 * @param options - Опции чтения
 * @returns Нода и её лист, либо ошибка
 */
export async function getNodeFromDb(
  projectId: number,
  nodeId: string,
  sheetId?: string,
  options?: ReadDbOptions,
): Promise<{ sheetId: string; node: RawNode } | { error: string }> {
  const fetched = await fetchProjectFromDb(projectId, options);
  if ('error' in fetched) return fetched;

  for (const sheet of selectSheets(fetched.data, sheetId)) {
    const node = (sheet.nodes ?? []).find((n) => n.id === nodeId);
    if (node) return { sheetId: sheet.id, node };
  }
  return { error: `Нода не найдена: ${nodeId}` };
}

/**
 * Возвращает агрегированную сводку проекта из живой БД: листы, число нод, типы.
 * @param projectId - Числовой ID проекта
 * @param options - Опции чтения
 * @returns Сводка по проекту или ошибка
 */
export async function summarizeProjectFromDb(
  projectId: number,
  options?: ReadDbOptions,
): Promise<{ activeSheetId?: string; totalNodes: number; sheets: SheetSummary[] } | { error: string }> {
  const fetched = await fetchProjectFromDb(projectId, options);
  if ('error' in fetched) return fetched;

  let totalNodes = 0;
  const sheets: SheetSummary[] = selectSheets(fetched.data).map((sheet) => {
    const typeCounts: Record<string, number> = {};
    for (const node of sheet.nodes ?? []) {
      const t = node.type ?? 'unknown';
      typeCounts[t] = (typeCounts[t] ?? 0) + 1;
    }
    const nodeCount = (sheet.nodes ?? []).length;
    totalNodes += nodeCount;
    return { sheetId: sheet.id, name: sheet.name, nodeCount, typeCounts };
  });

  return { activeSheetId: fetched.data.activeSheetId, totalNodes, sheets };
}
