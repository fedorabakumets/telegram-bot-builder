/**
 * @fileoverview Генерация глобального обработчика подтверждения рассылки
 * 
 * Модуль создаёт Python-код для обработки кнопок подтверждения
 * рассылки (broadcast_confirm_yes/broadcast_confirm_no).
 * 
 * @module bot-generator/transitions/broadcast/generate-broadcast-global-handler
 */

import { generateBroadcastInline } from '../../Broadcast/BotApi/generateBroadcastHandler';
import { generateBroadcastClientInline } from '../../Broadcast/Client/generateBroadcastClientHandler';
import { generateDatabaseVariablesCode } from '../../Broadcast/generateDatabaseVariables';
import { formatTextForPython } from '../../format';

/**
 * Параметры для генерации глобального обработчика рассылки
 */
export interface BroadcastGlobalHandlerParams {
  broadcastNode: any;
  nodes: any[];
}

/**
 * Генерирует Python-код для словаря всех узлов
 * 
 * @param nodes - Массив всех узлов
 * @param indent - Отступ для форматирования кода
 * @returns Сгенерированный Python-код
 */
export function generateAllNodesDict(
  nodes: any[],
  indent: string = ''
): string {
  let code = '';
  code += `${indent}# Словарь всех узлов для автоперехода\n`;
  code += `${indent}all_nodes_dict = {\n`;
  
  nodes.forEach(node => {
    const messageText = node.data?.messageText || '';
    const attachedMedia = node.data?.attachedMedia || [];
    const imageUrl = node.data?.imageUrl || '';
    const audioUrl = node.data?.audioUrl || '';
    const videoUrl = node.data?.videoUrl || '';
    const documentUrl = node.data?.documentUrl || '';
    const autoTransitionTo = node.data?.autoTransitionTo || '';
    const mediaStr = attachedMedia.length > 0 ? JSON.stringify(attachedMedia) : '[]';
    const imageUrlStr = imageUrl ? `"${imageUrl}"` : '""';
    const audioUrlStr = audioUrl ? `"${audioUrl}"` : '""';
    const videoUrlStr = videoUrl ? `"${videoUrl}"` : '""';
    const documentUrlStr = documentUrl ? `"${documentUrl}"` : '""';
    const autoTransitionStr = autoTransitionTo ? `"${autoTransitionTo}"` : '""';
    
    code += `${indent}    "${node.id}": {"id": "${node.id}", "text": ${formatTextForPython(messageText)}, "attachedMedia": ${mediaStr}, "imageUrl": ${imageUrlStr}, "audioUrl": ${audioUrlStr}, "videoUrl": ${videoUrlStr}, "documentUrl": ${documentUrlStr}, "autoTransitionTo": ${autoTransitionStr}},\n`;
  });
  
  code += `${indent}}\n`;

  return code;
}

/**
 * Генерирует Python-код для обработчика подтверждения рассылки
 * 
 * @param params - Параметры рассылки
 * @param indent - Отступ для форматирования кода
 * @returns Сгенерированный Python-код
 */
export function generateBroadcastConfirmationHandler(
  params: BroadcastGlobalHandlerParams,
  indent: string = '    '
): string {
  const { broadcastNode, nodes } = params;
  const broadcastApiType = broadcastNode.data?.broadcastApiType || 'bot';
  
  let code = '';
  code += `${indent}# Глобальный обработчик подтверждения рассылки\n`;
  code += `${indent}@dp.callback_query(lambda c: c.data == "broadcast_confirm_yes" or c.data == "broadcast_confirm_no")\n`;
  code += `${indent}async def handle_broadcast_confirmation(callback_query: types.CallbackQuery):\n`;
  code += `${indent}    user_id = callback_query.from_user.id\n`;
  code += `${indent}    logging.info(f"📢 Подтверждение рассылки от пользователя {user_id}: {callback_query.data}")\n`;
  code += `${indent}    \n`;
  code += `${indent}    if callback_query.data == "broadcast_confirm_yes":\n`;
  code += (broadcastApiType === 'client' 
    ? generateBroadcastClientInline(broadcastNode, nodes, `${indent}        `) 
    : generateBroadcastInline(broadcastNode, nodes, `${indent}        `)) + '\n';
  code += `${indent}    else:\n`;
  code += `${indent}        await callback_query.message.edit_text("❌ Рассылка отменена")\n`;
  code += `${indent}    \n`;
  
  return code;
}

/**
 * Генерирует Python-код для обработчика прямой рассылки
 * 
 * @param params - Параметры рассылки
 * @param indent - Отступ для форматирования кода
 * @returns Сгенерированный Python-код
 */
export function generateBroadcastDirectHandler(
  params: BroadcastGlobalHandlerParams,
  indent: string = '    '
): string {
  const { broadcastNode, nodes } = params;
  const broadcastApiType = broadcastNode.data?.broadcastApiType || 'bot';
  
  let code = '';
  code += `${indent}# Обработчик для прямой рассылки (без подтверждения)\n`;
  code += `${indent}async def handle_broadcast_direct(callback_query: types.CallbackQuery):\n`;
  code += `${indent}    user_id = callback_query.from_user.id\n`;
  code += `${indent}    logging.info(f"📢 Прямая рассылка от пользователя {user_id}")\n`;
  code += `${indent}    \n`;
  code += `${indent}    # Получаем переменные из базы данных\n`;
  code += generateDatabaseVariablesCode(`${indent}    `);
  code += `${indent}    \n`;
  code += (broadcastApiType === 'client' 
    ? generateBroadcastClientInline(broadcastNode, nodes, `${indent}    `) 
    : generateBroadcastInline(broadcastNode, nodes, `${indent}    `)) + '\n';
  code += `${indent}    \n`;
  
  return code;
}
