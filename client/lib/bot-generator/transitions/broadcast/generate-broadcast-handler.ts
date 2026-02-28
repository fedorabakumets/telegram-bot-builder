/**
 * @fileoverview Генерация обработчика broadcast узлов
 * 
 * Модуль создаёт Python-код для обработки узлов рассылки
 * с поддержкой подтверждения и без.
 * 
 * @module bot-generator/transitions/broadcast/generate-broadcast-handler
 */

/**
 * Параметры для генерации обработчика broadcast
 */
export interface BroadcastHandlerParams {
  nodeId: string;
  enableConfirmation?: boolean;
  confirmationText?: string;
}

/**
 * Генерирует Python-код для обработки broadcast узла
 * 
 * @param params - Параметры broadcast
 * @param indent - Отступ для форматирования кода
 * @returns Сгенерированный Python-код
 */
export function generateBroadcastHandler(
  params: BroadcastHandlerParams,
  indent: string = '    '
): string {
  const { nodeId, enableConfirmation, confirmationText } = params;
  const text = confirmationText || 'Отправить рассылку всем пользователям?';
  
  let code = '';
  code += `${indent}# Обработка узла рассылки\n`;
  code += `${indent}logging.info(f"📢 Запуск рассылки из узла ${nodeId}")\n`;
  code += `${indent}\n`;
  
  if (enableConfirmation) {
    code += `${indent}# Сохраняем ID текущей рассылки для глобального обработчика\n`;
    code += `${indent}user_data[user_id]["current_broadcast_node_id"] = "${nodeId}"\n`;
    code += `${indent}\n`;
    code += `${indent}# Отправляем сообщение с подтверждением\n`;
    code += `${indent}confirm_text = "${text}"\n`;
    code += `${indent}confirm_text = replace_variables_in_text(confirm_text, {**user_data.get(user_id, {}), "user_id": user_id})\n`;
    code += `${indent}from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton\n`;
    code += `${indent}keyboard = InlineKeyboardMarkup(inline_keyboard=[\n`;
    code += `${indent}    [InlineKeyboardButton(text="✅ Подтвердить", callback_data="broadcast_confirm_yes")],\n`;
    code += `${indent}    [InlineKeyboardButton(text="❌ Отмена", callback_data="broadcast_confirm_no")]\n`;
    code += `${indent}])\n`;
    code += `${indent}await callback_query.message.answer(confirm_text, reply_markup=keyboard)\n`;
    code += `${indent}return\n`;
  } else {
    code += `${indent}# Рассылка без подтверждения - вызываем прямой обработчик\n`;
    code += `${indent}await handle_broadcast_direct(callback_query)\n`;
    code += `${indent}return\n`;
  }
  
  return code;
}
