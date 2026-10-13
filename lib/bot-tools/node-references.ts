/**
 * @fileoverview Полный обход ссылок между нодами сценария
 * @module lib/bot-tools/node-references
 */

import type { Node } from '@shared/schema';
import { collectAllNodes } from './collect-nodes.ts';

/** Описание одной ссылки на другую ноду */
export interface NodeReference {
  /** ID исходной ноды */
  sourceId: string;
  /** Тип исходной ноды */
  sourceType: string;
  /** ID листа исходной ноды */
  sourceSheetId: string;
  /** Имя листа исходной ноды */
  sourceSheetName: string;
  /** ID целевой ноды */
  targetId: string;
  /** Путь поля со ссылкой */
  path: string;
  /** Признак ссылки из кнопки */
  isButton: boolean;
  /** Индекс кнопки, если ссылка находится в buttons */
  buttonIndex?: number;
  /** Текст кнопки, если ссылка находится в buttons */
  buttonText?: string;
  /** Действие кнопки */
  buttonAction?: string;
}

/** Простые поля data, которые содержат ID ноды */
const REFERENCE_FIELDS = [
  'inputTargetNodeId', 'targetNodeId', 'next_node_id', 'nextNodeId',
  'autoNavigateTarget', 'fallbackTarget', 'autoTransitionTo', 'sourceNodeId',
  'keyboardNodeId', 'editKeyboardNodeId', 'sourceMessageNodeId',
  'refundEmptyTarget', 'refundNotFoundTarget', 'refundAlreadyRefundedTarget',
  'continueButtonTarget', 'broadcastTargetNode', 'afterPaymentTo',
  'subscriptionEmptyTarget', 'subscriptionErrorTarget', 'balanceErrorTarget',
  'afterLoopTo',
] as const;

/** Массивы объектов с полем target */
const TARGET_ARRAYS = ['commands', 'options', 'branches', 'parallelBranches', 'responseOptions'] as const;

/**
 * Добавляет строковую ссылку в результат.
 * @param result - Накопленный результат
 * @param base - Общие поля ссылки
 * @param target - Проверяемое значение цели
 * @param path - Путь поля
 */
function addReference(
  result: NodeReference[],
  base: Omit<NodeReference, 'targetId' | 'path' | 'isButton'>,
  target: unknown,
  path: string,
): void {
  if (typeof target !== 'string' || !target.trim()) return;
  result.push({ ...base, targetId: target, path, isButton: false });
}

/**
 * Собирает ссылки одной ноды.
 * @param node - Исходная нода
 * @param sheetId - ID листа
 * @param sheetName - Название листа
 * @returns Ссылки ноды на другие ноды
 */
export function collectReferencesFromNode(node: Node, sheetId: string, sheetName: string): NodeReference[] {
  const data = (node.data ?? {}) as Record<string, any>;
  const base = { sourceId: node.id, sourceType: node.type, sourceSheetId: sheetId, sourceSheetName: sheetName };
  const result: NodeReference[] = [];

  for (const field of REFERENCE_FIELDS) {
    if (field === 'broadcastTargetNode' && data[field] === 'all') continue;
    addReference(result, base, data[field], field);
  }
  for (const arrayName of TARGET_ARRAYS) {
    const items = data[arrayName];
    if (!Array.isArray(items)) continue;
    items.forEach((item, index) => addReference(result, base, item?.target, `${arrayName}[${index}].target`));
  }
  if (Array.isArray(data.buttons)) {
    data.buttons.forEach((button: Record<string, unknown>, index: number) => {
      const target = typeof button?.target === 'string' ? button.target : button?.targetNodeId;
      if (typeof target !== 'string' || !target.trim()) return;
      result.push({
        ...base,
        targetId: target,
        path: `buttons[${index}].${button.target ? 'target' : 'targetNodeId'}`,
        isButton: true,
        buttonIndex: index,
        buttonText: typeof button.text === 'string' ? button.text : '',
        buttonAction: typeof button.action === 'string' ? button.action : 'goto',
      });
    });
  }
  if (Array.isArray(data.conditionalMessages)) {
    data.conditionalMessages.forEach((item: Record<string, any>, index: number) => {
      addReference(result, base, item?.target, `conditionalMessages[${index}].target`);
      addReference(result, base, item?.nextNodeAfterInput, `conditionalMessages[${index}].nextNodeAfterInput`);
      if (!Array.isArray(item?.buttons)) return;
      item.buttons.forEach((button: Record<string, unknown>, buttonIndex: number) => {
        const target = typeof button?.target === 'string' ? button.target : button?.targetNodeId;
        if (typeof target !== 'string' || !target.trim()) return;
        result.push({
          ...base,
          targetId: target,
          path: `conditionalMessages[${index}].buttons[${buttonIndex}].${button.target ? 'target' : 'targetNodeId'}`,
          isButton: true,
          buttonIndex,
          buttonText: typeof button.text === 'string' ? button.text : '',
          buttonAction: typeof button.action === 'string' ? button.action : 'goto',
        });
      });
    });
  }
  if (Array.isArray(data.parallelBranches)) {
    data.parallelBranches.forEach((branch: Record<string, unknown>, index: number) =>
      addReference(result, base, branch?.onErrorTarget, `parallelBranches[${index}].onErrorTarget`),
    );
  }
  addReference(result, base, data.inputConfig?.next_node_id, 'inputConfig.next_node_id');
  return result;
}

/**
 * Собирает все ссылки проекта.
 * @param project - Данные project.json
 * @returns Плоский список ссылок
 */
export function collectProjectNodeReferences(project: Record<string, unknown>): NodeReference[] {
  return collectAllNodes(project).flatMap(({ node, sheetId, sheetName }) =>
    collectReferencesFromNode(node, sheetId, sheetName),
  );
}
