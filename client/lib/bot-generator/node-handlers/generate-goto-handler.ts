/**
 * @fileoverview Обработка кнопок goto и навигация между узлами
 * 
 * Модуль создаёт Python-код для обработки кнопок с действием 'goto',
 * поиска целевых узлов и предотвращения дублирования обработчиков.
 * 
 * @module bot-generator/node-handlers/generate-goto-handler
 */

import { isLoggingEnabled } from '../../bot-generator';

/**
 * Генерирует Python-код для обработки кнопки goto
 * 
 * @param button - Данные кнопки
 * @param nodes - Массив всех узлов
 * @param processedCallbacks - Set обработанных callback_data
 * @returns Объект с данными для генерации обработчика
 */
export function generateGotoHandler(
  button: any,
  nodes: any[],
  processedCallbacks: Set<string>
): { 
  shouldSkip: boolean; 
  callbackData: string; 
  targetNode: any | null; 
  actualCallbackData: string;
  actualNodeId: string | null;
} | null {
  if (button.action !== 'goto' || !button.id) {
    return null;
  }

  const callbackData = button.id;

  // Избегаем дублирования обработчиков
  if (processedCallbacks.has(`cb_${callbackData}`)) {
    return { shouldSkip: true, callbackData, targetNode: null, actualCallbackData: '', actualNodeId: null };
  }

  // Проверяем дублирование для target узлов
  if (button.target && processedCallbacks.has(`cb_${button.target}`)) {
    if (isLoggingEnabled()) {
      console.log(`🚨 ГЕНЕРАТОР: ПРОПУСКАЕМ дублирующий обработчик для target ${button.target} - уже создан`);
    }
    return { shouldSkip: true, callbackData, targetNode: null, actualCallbackData: '', actualNodeId: null };
  }

  // Ищем целевой узел сначала по id, затем по команде
  let targetNode = button.target ? nodes.find(n => n.id === button.target) : null;

  if (!targetNode && button.target) {
    targetNode = nodes.find(n => n.data.command === `/${button.target}` || n.data.command === button.target);
    if (targetNode && isLoggingEnabled()) {
      console.log(`🔧 ГЕНЕРАТОР: Узел найден по команде ${button.target} -> ${targetNode.id}`);
    }
  }

  // Определяем фактические callback_data и node_id
  const actualCallbackData = button.target || callbackData;
  const actualNodeId = targetNode ? targetNode.id : button.target;

  // Отмечаем как обработанные
  processedCallbacks.add(`cb_${callbackData}`);
  if (button.target) {
    processedCallbacks.add(`cb_${button.target}`);
    if (isLoggingEnabled()) {
      console.log(`🔧 ГЕНЕРАТОР: Узел ${button.target} добавлен в processedCallbacks ДО создания обработчика`);
    }
  }

  return {
    shouldSkip: false,
    callbackData,
    targetNode,
    actualCallbackData,
    actualNodeId
  };
}
