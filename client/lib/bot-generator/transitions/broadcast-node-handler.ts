/**
 * @fileoverview Обработка узлов рассылки
 *
 * Модуль генерирует Python-код для обработки узлов типа broadcast,
 * которые отправляют сообщения множеству пользователей.
 *
 * @module bot-generator/transitions/broadcast-node-handler
 */

/**
 * Параметры для генерации обработчика рассылки
 */
export interface BroadcastNodeParams {
  /** ID узла рассылки */
  nodeId: string;
  /** Требуется ли подтверждение рассылки */
  enableConfirmation?: boolean;
  /** Текст подтверждения */
  confirmationText?: string;
  /** Тип API для рассылки (bot или client) */
  broadcastApiType?: string;
}

/**
 * Генерирует код обработки узла рассылки
 *
 * @param params - Параметры узла рассылки
 * @param indent - Отступ для кода
 * @returns Сгенерированный Python-код
 */
export function generateBroadcastNodeHandler(
  params: BroadcastNodeParams,
  indent: string = '    '
): string {
  const { nodeId, broadcastApiType = 'bot' } = params;
  const safeNodeId = nodeId.replace(/[^a-zA-Z0-9_]/g, '_');
  
  // Для Client API добавляем префикс 'client_' к имени функции
  const functionName = broadcastApiType === 'client' 
    ? `handle_broadcast_client_${safeNodeId}`
    : `handle_broadcast_${safeNodeId}`;

  let code = '';
  code += `${indent}# Обработка узла рассылки\n`;

  // Генерируем вызов обработчика рассылки
  code += `${indent}await ${functionName}(callback_query)\n`;

  return code;
}

/**
 * Проверяет, является ли узел типом broadcast
 *
 * @param nodeType - Тип узла
 * @returns true если узел типа broadcast
 */
export function isBroadcastNode(nodeType: string): boolean {
  return nodeType === 'broadcast';
}
