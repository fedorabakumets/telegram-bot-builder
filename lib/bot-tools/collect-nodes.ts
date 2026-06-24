/**
 * @fileoverview Сбор всех нод из project.json (формат sheets)
 * @module lib/bot-tools/collect-nodes
 */

import type { Node } from '@shared/schema';

/** Нода с контекстом листа */
export interface NodeWithSheet {
  /** Узел */
  node: Node;
  /** ID листа */
  sheetId: string;
  /** Имя листа */
  sheetName: string;
}

/**
 * Извлекает все ноды из project.json в формате sheets
 * @param project - Данные проекта
 * @returns Плоский список нод с метаданными листа
 */
export function collectAllNodes(project: Record<string, unknown>): NodeWithSheet[] {
  const sheets = Array.isArray(project.sheets) ? project.sheets : [];
  const result: NodeWithSheet[] = [];

  for (const sheet of sheets) {
    if (!sheet || typeof sheet !== 'object') continue;
    const sheetRecord = sheet as Record<string, unknown>;
    const sheetId = String(sheetRecord.id ?? 'unknown');
    const sheetName = String(sheetRecord.name ?? sheetId);
    const nodes = Array.isArray(sheetRecord.nodes) ? sheetRecord.nodes : [];

    for (const node of nodes) {
      if (node && typeof node === 'object') {
        result.push({ node: node as Node, sheetId, sheetName });
      }
    }
  }

  return result;
}

/**
 * Собирает все переходы (target) из ноды
 * @param node - Узел бота
 * @returns Список пар (метка перехода, target id)
 */
export function collectNodeTransitions(node: Node): Array<{ label: string; target: string }> {
  const data = node.data ?? {};
  const transitions: Array<{ label: string; target: string }> = [];

  if (data.autoTransitionTo) {
    transitions.push({ label: 'autoTransitionTo', target: data.autoTransitionTo });
  }
  if (data.keyboardNodeId) {
    transitions.push({ label: 'keyboardNodeId', target: data.keyboardNodeId });
  }
  if (data.inputTargetNodeId) {
    transitions.push({ label: 'inputTargetNodeId', target: data.inputTargetNodeId });
  }

  for (const btn of data.buttons ?? []) {
    if (btn.target) {
      transitions.push({ label: `button:${btn.text ?? btn.id}`, target: btn.target });
    }
  }
  for (const branch of data.branches ?? []) {
    if (branch.target) {
      transitions.push({ label: `branch:${branch.label ?? branch.id}`, target: branch.target });
    }
  }
  for (const branch of data.parallelBranches ?? []) {
    if (branch.target) {
      transitions.push({ label: `parallel:${branch.label ?? branch.id}`, target: branch.target });
    }
  }

  return transitions;
}
