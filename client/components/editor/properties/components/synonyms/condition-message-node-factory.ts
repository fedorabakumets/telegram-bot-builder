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

  const src = sourceNode.data as any;

  return {
    id: `msg-cond-${cond.id}`,
    type: 'message',
    position: {
      x: sourceNode.position.x + 650,
      y: sourceNode.position.y - 100 + index * 150,
    },
    data: {
      messageText: resolvedText,
      /** formatMode: допустимые значения 'html' | 'markdown' | 'none' — 'text' не валидно */
      formatMode: (['html', 'markdown', 'none'].includes(cond.formatMode) ? cond.formatMode
        : ['html', 'markdown', 'none'].includes(src.formatMode) ? src.formatMode
        : 'none'),
      keyboardType: cond.keyboardType || src.keyboardType || 'none',
      buttons: cond.buttons?.length ? cond.buttons : (src.buttons || []),
      /** Ссылка на ID условия — используется для поиска узла по условию */
      condSourceId: cond.id,
      synonyms: [],
      attachedMedia: src.attachedMedia || [],
      oneTimeKeyboard: src.oneTimeKeyboard ?? false,
      resizeKeyboard: src.resizeKeyboard ?? true,
      markdown: src.markdown ?? false,
      isPrivateOnly: src.isPrivateOnly ?? false,
      adminOnly: src.adminOnly ?? false,
      requiresAuth: src.requiresAuth ?? false,
      enableStatistics: src.enableStatistics ?? true,
      enableAutoTransition: src.enableAutoTransition ?? false,
      /** Поля сбора ответов — копируются из исходного узла */
      collectUserInput: src.collectUserInput ?? false,
      enableTextInput: src.enableTextInput,
      enablePhotoInput: src.enablePhotoInput,
      enableVideoInput: src.enableVideoInput,
      enableAudioInput: src.enableAudioInput,
      enableDocumentInput: src.enableDocumentInput,
      saveToDatabase: src.saveToDatabase ?? false,
      inputVariable: src.inputVariable,
      inputPrompt: src.inputPrompt,
      inputTargetNodeId: src.inputTargetNodeId,
      allowSkip: src.allowSkip ?? false,
      appendVariable: src.appendVariable ?? false,
      variableFilters: src.variableFilters || {},
      photoInputVariable: src.photoInputVariable,
      videoInputVariable: src.videoInputVariable,
      audioInputVariable: src.audioInputVariable,
      documentInputVariable: src.documentInputVariable,
      customParameters: src.customParameters || [],
      options: src.options || [],
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
 * Поля сбора ответов всегда берутся из исходного узла.
 *
 * @param {any} cond - Объект условия
 * @param {Node} [sourceNode] - Исходный узел (для текста и полей сбора ответов)
 * @returns {Partial<any>} Поля для обновления через onNodeUpdate
 */
export function getMessageNodeUpdates(cond: any, sourceNode?: Node): Partial<any> {
  const resolvedText = (cond.showCustomMessage && cond.messageText)
    ? cond.messageText
    : ((sourceNode?.data as any)?.messageText || cond.messageText || '');

  const src = (sourceNode?.data as any) || {};

  return {
    messageText: resolvedText,
    /** formatMode: допустимые значения 'html' | 'markdown' | 'none' — 'text' не валидно */
    formatMode: (['html', 'markdown', 'none'].includes(cond.formatMode) ? cond.formatMode
      : ['html', 'markdown', 'none'].includes(src.formatMode) ? src.formatMode
      : 'none'),
    keyboardType: cond.keyboardType || src.keyboardType || 'none',
    buttons: cond.buttons?.length ? cond.buttons : (src.buttons || []),
    attachedMedia: src.attachedMedia || [],
    oneTimeKeyboard: src.oneTimeKeyboard ?? false,
    resizeKeyboard: src.resizeKeyboard ?? true,
    markdown: src.markdown ?? false,
    /** Поля сбора ответов — синхронизируются из исходного узла */
    collectUserInput: src.collectUserInput ?? false,
    enableTextInput: src.enableTextInput,
    enablePhotoInput: src.enablePhotoInput,
    enableVideoInput: src.enableVideoInput,
    enableAudioInput: src.enableAudioInput,
    enableDocumentInput: src.enableDocumentInput,
    saveToDatabase: src.saveToDatabase ?? false,
    inputVariable: src.inputVariable,
    inputPrompt: src.inputPrompt,
    inputTargetNodeId: src.inputTargetNodeId,
    allowSkip: src.allowSkip ?? false,
    appendVariable: src.appendVariable ?? false,
    variableFilters: src.variableFilters || {},
    photoInputVariable: src.photoInputVariable,
    videoInputVariable: src.videoInputVariable,
    audioInputVariable: src.audioInputVariable,
    documentInputVariable: src.documentInputVariable,
  };
}
