/**
 * @fileoverview Обработка условных сообщений
 *
 * Модуль генерирует Python-код для проверки условий и отправки
 * соответствующих сообщений на основе данных пользователя.
 *
 * @module bot-generator/transitions/conditional-messages-handler
 */

import type { ConditionalMessageParams } from './types/conditional-message-params';

/**
 * Параметры для генерации проверки условных сообщений
 */
export interface ConditionalMessagesParams {
  /** Массив условных сообщений */
  conditionalMessages: ConditionalMessageParams[];
}

/**
 * Генерирует код проверки условных сообщений
 *
 * @param params - Параметры условных сообщений
 * @param indent - Отступ для кода
 * @returns Сгенерированный Python-код или пустая строка
 */
export function generateConditionalMessagesCheck(
  params: ConditionalMessagesParams,
  indent: string = '    '
): string {
  const { conditionalMessages } = params;

  if (!conditionalMessages || conditionalMessages.length === 0) {
    return '';
  }

  let code = '';
  code += `${indent}# Обработка условных сообщений\n`;
  code += `${indent}# Проверка условий и отправка соответствующего сообщения\n`;

  return code;
}

/**
 * Проверяет, есть ли узел условные сообщения
 *
 * @param nodeData - Данные узла
 * @returns true если есть условные сообщения
 */
export function hasConditionalMessages(nodeData: {
  enableConditionalMessages?: boolean;
  conditionalMessages?: ConditionalMessageParams[];
}): boolean {
  return (nodeData?.enableConditionalMessages ?? false) &&
    !!nodeData?.conditionalMessages &&
    nodeData.conditionalMessages.length > 0;
}
