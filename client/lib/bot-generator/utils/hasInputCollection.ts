/**
 * @fileoverview Проверка наличия сбора пользовательского ввода
 * Модуль проверяет узлы на наличие различных типов ввода в ОДИН проход
 */

import type { BotNode } from '../types';
import type { InputCollectionCheckResult } from './types/input-collection-check-result';

/**
 * Проверяет узлы на наличие сбора пользовательского ввода за ОДИН проход
 * @param nodes - Массив узлов для проверки
 * @returns Результат проверки с флагами по каждому типу ввода
 *
 * @example
 * const result = hasInputCollection(nodes);
 * if (result.hasPhotoInput) { /* ... */ }
 */
export function hasInputCollection(nodes: BotNode[]): InputCollectionCheckResult {
  if (!nodes || nodes.length === 0) {
    return {
      hasCollectInput: false,
      hasTextInput: false,
      hasPhotoInput: false,
      hasVideoInput: false,
      hasAudioInput: false,
      hasDocumentInput: false,
      hasConditionalInput: false,
      hasMultiSelect: false,
      hasAnyInput: false,
    };
  }

  const result: InputCollectionCheckResult = {
    hasCollectInput: false,
    hasTextInput: false,
    hasPhotoInput: false,
    hasVideoInput: false,
    hasAudioInput: false,
    hasDocumentInput: false,
    hasConditionalInput: false,
    hasMultiSelect: false,
    hasAnyInput: false,
  };

  // ОДИН проход вместо 7 отдельных
  for (const node of nodes) {
    if (!node) continue;

    const data = node.data || {};

    if (data.collectUserInput) result.hasCollectInput = true;
    if (data.enableTextInput) result.hasTextInput = true;
    if (data.enablePhotoInput) result.hasPhotoInput = true;
    if (data.enableVideoInput) result.hasVideoInput = true;
    if (data.enableAudioInput) result.hasAudioInput = true;
    if (data.enableDocumentInput) result.hasDocumentInput = true;
    if (data.allowMultipleSelection === true) result.hasMultiSelect = true;

    // Проверка условных сообщений
    const conditions = data.conditionalMessages;
    if (conditions?.some((cond: any) => cond.waitForTextInput)) {
      result.hasConditionalInput = true;
    }
  }

  // Общий результат
  result.hasAnyInput =
    result.hasCollectInput ||
    result.hasTextInput ||
    result.hasPhotoInput ||
    result.hasVideoInput ||
    result.hasAudioInput ||
    result.hasDocumentInput ||
    result.hasConditionalInput ||
    result.hasMultiSelect;

  return result;
}
