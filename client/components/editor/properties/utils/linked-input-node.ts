/**
 * @fileoverview Утилиты для поиска и отображения связанного `input`-узла у `message`.
 */

import type { Node } from '@shared/schema';
import { nanoid } from 'nanoid';
import { getNodeDefaults } from './node-defaults';
import type { NodeWithSheet } from './node-utils';

/**
 * Краткая сводка по связанному `input`-узлу.
 */
export interface LinkedInputSummary {
  /** ID связанного узла. */
  nodeId: string;
  /** Тип узла. */
  nodeType: Node['type'];
  /** Тип источника ответа. */
  inputType: string;
  /** Переменная для сохранения ответа. */
  inputVariable: string;
  /** Режим записи: добавление или замена. */
  appendVariable: boolean;
  /** Следующий узел после сохранения ответа. */
  inputTargetNodeId: string;
  /** Название листа, где находится узел. */
  sheetName: string;
}

/**
 * Состояние связанного ввода у `message`.
 */
export interface MessageInputCollectionState {
  /** Есть ли активный сбор ответа. */
  isEnabled: boolean;
  /** Связан ли узел с отдельным `input`. */
  isLinked: boolean;
  /** Использует ли узел старые поля ввода без отдельного `input`. */
  isLegacy: boolean;
  /** Краткая сводка по активному или legacy-вводу. */
  summary: LinkedInputSummary | null;
}

/**
 * Находит связанный `input`-узел по `autoTransitionTo`.
 *
 * @param {Node} selectedNode - Выбранный узел.
 * @param {NodeWithSheet[]} nodes - Все узлы всех листов.
 * @returns {NodeWithSheet | null} Связанный `input`-узел или `null`.
 */
export function getLinkedInputNode(
  selectedNode: Node,
  nodes: NodeWithSheet[]
): NodeWithSheet | null {
  const linkedNodeId = (selectedNode.data as any)?.autoTransitionTo || '';
  if (!linkedNodeId) return null;

  return nodes.find(({ node }) => node.id === linkedNodeId && node.type === 'input') ?? null;
}

/**
 * Формирует краткую сводку по связанному `input`-узлу.
 *
 * @param {NodeWithSheet | null} linkedNode - Связанный узел.
 * @returns {LinkedInputSummary | null} Сводка по узлу или `null`.
 */
export function getLinkedInputSummary(linkedNode: NodeWithSheet | null): LinkedInputSummary | null {
  if (!linkedNode) return null;

  const data = linkedNode.node.data as any;

  return {
    nodeId: linkedNode.node.id,
    nodeType: linkedNode.node.type,
    inputType: data.inputType || 'any',
    inputVariable: data.inputVariable || '',
    appendVariable: !!data.appendVariable,
    inputTargetNodeId: data.inputTargetNodeId || '',
    sheetName: linkedNode.sheetName,
  };
}

/**
 * Проверяет, есть ли у `message` старые поля сбора ответа.
 *
 * @param {Node} node - Проверяемый узел.
 * @returns {boolean} `true`, если в узле есть legacy-настройки ввода.
 */
export function hasLegacyMessageInput(node: Node): boolean {
  const data = node.data as any;
  return Boolean(
    data.collectUserInput ||
    data.inputType ||
    data.enableTextInput ||
    data.enablePhotoInput ||
    data.enableVideoInput ||
    data.enableAudioInput ||
    data.enableDocumentInput ||
    data.inputRequired ||
    data.appendVariable ||
    data.inputVariable ||
    data.textInputVariable ||
    data.photoInputVariable ||
    data.videoInputVariable ||
    data.audioInputVariable ||
    data.documentInputVariable ||
    data.waitForTextInput ||
    data.inputTargetNodeId ||
    data.inputPrompt ||
    data.saveToDatabase
  );
}

/**
 * Возвращает тип ответа для legacy-настроек `message`.
 *
 * @param {Node} node - Исходный узел.
 * @returns {string} Тип ответа для нового `input`.
 */
export function resolveLegacyInputType(node: Node): string {
  const data = node.data as any;

  if (data.inputType) return data.inputType;
  if (data.enablePhotoInput) return 'photo';
  if (data.enableVideoInput) return 'video';
  if (data.enableAudioInput) return 'audio';
  if (data.enableDocumentInput) return 'document';
  if (data.enableTextInput || data.waitForTextInput) return 'text';
  if (data.collectUserInput) return 'any';

  return 'any';
}

/**
 * Возвращает переменную для legacy-настроек `message`.
 *
 * @param {Node} node - Исходный узел.
 * @param {string} inputType - Определённый тип ответа.
 * @returns {string} Имя переменной или пустая строка.
 */
export function resolveLegacyInputVariable(node: Node, inputType: string): string {
  const data = node.data as any;

  switch (inputType) {
    case 'photo':
      return data.photoInputVariable || data.inputVariable || '';
    case 'video':
      return data.videoInputVariable || data.inputVariable || '';
    case 'audio':
      return data.audioInputVariable || data.inputVariable || '';
    case 'document':
      return data.documentInputVariable || data.inputVariable || '';
    default:
      return data.inputVariable || data.textInputVariable || data.photoInputVariable || data.videoInputVariable || data.audioInputVariable || data.documentInputVariable || '';
  }
}

/**
 * Формирует сводку по legacy-вводу `message`.
 *
 * @param {Node} node - Узел сообщения.
 * @returns {LinkedInputSummary | null} Сводка legacy-ввода или `null`.
 */
export function getLegacyInputSummary(node: Node): LinkedInputSummary | null {
  if (!hasLegacyMessageInput(node)) return null;

  const inputType = resolveLegacyInputType(node);

  return {
    nodeId: node.id,
    nodeType: node.type,
    inputType,
    inputVariable: resolveLegacyInputVariable(node, inputType),
    appendVariable: !!(node.data as any).appendVariable,
    inputTargetNodeId: (node.data as any).inputTargetNodeId || '',
    sheetName: 'Текущий узел',
  };
}

/**
 * Возвращает состояние ввода для `message`.
 *
 * @param {Node} selectedNode - Узел сообщения.
 * @param {NodeWithSheet[]} nodes - Все узлы всех листов.
 * @returns {MessageInputCollectionState} Состояние связанного ввода.
 */
export function getMessageInputCollectionState(
  selectedNode: Node,
  nodes: NodeWithSheet[]
): MessageInputCollectionState {
  const linkedNode = getLinkedInputNode(selectedNode, nodes);
  const legacySummary = getLegacyInputSummary(selectedNode);
  if (linkedNode) {
    return {
      isEnabled: true,
      isLinked: true,
      isLegacy: false,
      summary: getLinkedInputSummary(linkedNode),
    };
  }

  return {
    isEnabled: Boolean((selectedNode.data as any).collectUserInput),
    isLinked: false,
    isLegacy: Boolean(legacySummary),
    summary: legacySummary,
  };
}

/**
 * Создаёт новый `input`-узел на основе legacy-настроек `message`.
 *
 * @param {Node} messageNode - Узел сообщения, из которого мигрируем данные.
 * @param {number} [index=0] - Смещение по Y для нескольких мигрированных узлов.
 * @returns {Node} Новый узел `input`.
 */
export function createInputNodeFromMessage(messageNode: Node, index = 0): Node {
  const defaults = getNodeDefaults('input') as Record<string, unknown>;
  const inputType = resolveLegacyInputType(messageNode);
  const inputVariable = resolveLegacyInputVariable(messageNode, inputType);
  const data = messageNode.data as any;

  return {
    id: `input-${nanoid(8)}`,
    type: 'input',
    position: {
      x: messageNode.position.x + 320,
      y: messageNode.position.y + index * 120,
    },
      data: {
      ...defaults,
      inputType,
      inputVariable,
      inputTargetNodeId: data.inputTargetNodeId || data.autoTransitionTo || '',
      appendVariable: !!data.appendVariable,
      saveToDatabase: !!data.saveToDatabase,
      inputPrompt: data.inputPrompt || defaults.inputPrompt || 'Введите ответ',
      inputRequired: data.inputRequired ?? defaults.inputRequired ?? true,
    },
  } as Node;
}
