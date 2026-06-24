/**
 * @fileoverview Read-only запросы состояния проекта и нод из живой БД приложения
 * @description Лёгкие инструменты для ориентации агента в текущем сценарии без вытягивания
 * всего project.json: список нод с краткой сводкой, одна нода по id, агрегированная сводка
 * по листам/типам. Все функции читают актуальные данные через fetchProjectFromDb (GET /api/projects/:id).
 * @module lib/bot-tools/node-query-db
 */

import type { BotDataWithSheets } from '@shared/schema';
import { fetchProjectFromDb, type FetchProjectFromDbOptions } from './project-db-read.ts';
import { collectAllNodes, collectNodeTransitions } from './collect-nodes.ts';

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

/** Ребро графа связей проекта (from→to) */
export interface ConnectionEdge {
  /** ID исходной ноды */
  from: string;
  /** ID листа исходной ноды */
  fromSheetId: string;
  /** ID целевой ноды (target перехода) */
  to: string;
  /** Тип перехода: auto/input/keyboard/button/branch/parallel */
  type: 'auto' | 'input' | 'keyboard' | 'button' | 'branch' | 'parallel';
  /** Исходная метка перехода из collectNodeTransitions */
  label: string;
  /** true, если target указывает на несуществующую ноду (битая связь) */
  broken: boolean;
}

/**
 * Выводит тип ребра из метки перехода collectNodeTransitions.
 * @param label - Метка перехода (autoTransitionTo|inputTargetNodeId|keyboardNodeId|button:...|branch:...|parallel:...)
 * @returns Тип ребра графа связей
 */
function edgeTypeFromLabel(label: string): ConnectionEdge['type'] {
  if (label.startsWith('button:')) return 'button';
  if (label.startsWith('branch:')) return 'branch';
  if (label.startsWith('parallel:')) return 'parallel';
  if (label === 'inputTargetNodeId') return 'input';
  if (label === 'keyboardNodeId') return 'keyboard';
  return 'auto';
}

/**
 * Возвращает граф связей проекта из живой БД: рёбра from→to с типом и флагом broken.
 * Read-only: ничего не пишет в БД.
 * @param projectId - Числовой ID проекта из URL редактора
 * @param options - Опции чтения (URL API)
 * @returns Список рёбер графа связей или ошибка
 */
export async function listConnectionsInDb(
  projectId: number,
  options?: ReadDbOptions,
): Promise<{ total: number; connections: ConnectionEdge[] } | { error: string }> {
  const fetched = await fetchProjectFromDb(projectId, options);
  if ('error' in fetched) return fetched;

  const data = fetched.data as unknown as Record<string, unknown>;
  const all = collectAllNodes(data);
  const nodeIds = new Set(all.map((e) => e.node.id));

  const connections: ConnectionEdge[] = [];
  for (const { node, sheetId } of all) {
    for (const { label, target } of collectNodeTransitions(node)) {
      connections.push({
        from: node.id,
        fromSheetId: sheetId,
        to: target,
        type: edgeTypeFromLabel(label),
        label,
        broken: !nodeIds.has(target),
      });
    }
  }

  return { total: connections.length, connections };
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
