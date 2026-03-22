/**
 * @fileoverview Фабрика узлов-сообщений для веток узла condition
 *
 * Содержит вспомогательные функции для создания узлов типа `message`,
 * которые соответствуют каждому условию из `conditionalMessages`.
 * ID узла строится детерминированно: `msg-cond-${cond.id}`.
 *
 * @module properties/components/synonyms/condition-message-node-factory
 */

import { Node } from '@shared/schema';

/**
 * Создаёт узел типа `message` для одного условия из conditionalMessages.
 *
 * Если у условия включено кастомное сообщение (`showCustomMessage === true`) и задан `messageText` —
 * используется текст условия. Иначе берётся основной текст исходного узла (`sourceNode.data.messageText`).
 *
 * @param {any} cond - Объект условия из conditionalMessages
 * @param {string} conditionNodeId - ID узла condition
 * @param {Node} sourceNode - Исходный узел (для вычисления позиции и текста по умолчанию)
 * @param {number} index - Порядковый индекс условия (для смещения по Y)
 * @returns {Node} Новый узел типа message
 */
export function createMessageNodeForCondition(
  cond: any,
  conditionNodeId: string,
  sourceNode: Node,
  index: number
): Node {
  /** Текст: кастомный если включён, иначе основной текст исходного узла */
  const resolvedText = (cond.showCustomMessage && cond.messageText)
    ? cond.messageText
    : ((sourceNode.data as any).messageText || '');

  return {
    id: `msg-cond-${cond.id}`,
    type: 'message',
    position: {
      x: sourceNode.position.x + 650,
      y: sourceNode.position.y - 100 + index * 150,
    },
    data: {
      messageText: resolvedText,
      formatMode: cond.formatMode || 'text',
      keyboardType: cond.keyboardType || 'none',
      buttons: cond.buttons || [],
      collectUserInput: cond.collectUserInput || false,
      enableTextInput: cond.enableTextInput || false,
      /** Ссылка на ID условия — используется для поиска узла по условию */
      condSourceId: cond.id,
      synonyms: [],
      attachedMedia: [],
      oneTimeKeyboard: false,
      resizeKeyboard: true,
      markdown: false,
      isPrivateOnly: false,
      adminOnly: false,
      requiresAuth: false,
      enableStatistics: true,
      enableAutoTransition: false,
      saveToDatabase: false,
      allowSkip: false,
      appendVariable: false,
      variableFilters: {},
      customParameters: [],
      options: [],
      conditionalMessages: [],
      enableConditionalMessages: false,
    } as any,
  };
}

/**
 * Возвращает данные для обновления существующего узла-сообщения из условия.
 *
 * Если у условия включено кастомное сообщение — берётся его текст,
 * иначе — основной текст исходного узла.
 *
 * @param {any} cond - Объект условия
 * @param {Node} [sourceNode] - Исходный узел (для текста по умолчанию)
 * @returns {Partial<any>} Поля для обновления через onNodeUpdate
 */
export function getMessageNodeUpdates(cond: any, sourceNode?: Node): Partial<any> {
  const resolvedText = (cond.showCustomMessage && cond.messageText)
    ? cond.messageText
    : ((sourceNode?.data as any)?.messageText || cond.messageText || '');

  return {
    messageText: resolvedText,
    formatMode: cond.formatMode || 'text',
    keyboardType: cond.keyboardType || 'none',
    buttons: cond.buttons || [],
    collectUserInput: cond.collectUserInput || false,
    enableTextInput: cond.enableTextInput || false,
  };
}
