/**
 * @fileoverview Простой diff двух наборов нод проекта (по id)
 *
 * Собирает ноды со всех листов снимка и сравнивает их с текущим состоянием:
 * добавленные, удалённые и изменённые (по JSON-представлению при совпадении id).
 *
 * @module editor/versions/version-diff
 */

/** Результат сравнения двух наборов нод */
export interface NodeDiff {
  /** ID нод, добавленных в текущем состоянии (отсутствуют в версии) */
  added: string[];
  /** ID нод, удалённых в текущем состоянии (были в версии) */
  removed: string[];
  /** ID нод, изменённых при совпадении id (различается JSON.stringify) */
  changed: string[];
}

/** Минимальная форма ноды для diff */
interface DiffNode {
  /** Уникальный идентификатор ноды */
  id?: string;
}

/**
 * Собирает все ноды из данных проекта (со всех листов + legacy nodes)
 * @param data - Данные проекта (BotDataWithSheets или BotData)
 * @returns Карта id → нода
 */
export function collectNodes(data: unknown): Map<string, DiffNode> {
  const map = new Map<string, DiffNode>();
  if (!data || typeof data !== 'object') return map;
  const root = data as { sheets?: Array<{ nodes?: DiffNode[] }>; nodes?: DiffNode[] };
  const pools: DiffNode[][] = [];
  if (Array.isArray(root.sheets)) {
    for (const sheet of root.sheets) {
      if (Array.isArray(sheet?.nodes)) pools.push(sheet.nodes);
    }
  }
  if (Array.isArray(root.nodes)) pools.push(root.nodes);
  for (const pool of pools) {
    for (const node of pool) {
      if (node && typeof node.id === 'string') map.set(node.id, node);
    }
  }
  return map;
}

/**
 * Сравнивает набор нод версии с текущим состоянием проекта
 * @param versionData - Данные снимка версии
 * @param currentData - Текущие данные проекта
 * @returns Diff с массивами added/removed/changed
 */
export function diffNodes(versionData: unknown, currentData: unknown): NodeDiff {
  const versionNodes = collectNodes(versionData);
  const currentNodes = collectNodes(currentData);
  const added: string[] = [];
  const removed: string[] = [];
  const changed: string[] = [];

  for (const [id, node] of currentNodes) {
    if (!versionNodes.has(id)) {
      added.push(id);
    } else if (JSON.stringify(node) !== JSON.stringify(versionNodes.get(id))) {
      changed.push(id);
    }
  }
  for (const id of versionNodes.keys()) {
    if (!currentNodes.has(id)) removed.push(id);
  }
  return { added, removed, changed };
}
