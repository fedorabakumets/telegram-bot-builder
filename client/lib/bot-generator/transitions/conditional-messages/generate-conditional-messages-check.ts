/**
 * @fileoverview Генерация обработки условных сообщений
 * 
 * Модуль создаёт Python-код для проверки и обработки
 * условных сообщений в callback обработчиках.
 * 
 * @module bot-generator/transitions/conditional-messages/generate-conditional-messages-check
 */

import { generateConditionalMessageLogic } from '../../Conditional';

/**
 * Параметры для генерации обработки условных сообщений
 */
export interface ConditionalMessagesCheckParams {
  conditionalMessages: any[];
}

/**
 * Генерирует Python-код для обработки условных сообщений
 * 
 * @param params - Параметры условных сообщений
 * @param indent - Отступ для форматирования кода
 * @returns Сгенерированный Python-код
 */
export function generateConditionalMessagesCheck(
  params: ConditionalMessagesCheckParams,
  indent: string = '    '
): string {
  const { conditionalMessages } = params;
  
  let code = '';
  code += `${indent}\n`;
  code += `${indent}# Проверка условных сообщений для навигации\n`;
  code += `${indent}conditional_parse_mode = None\n`;
  code += `${indent}conditional_keyboard = None\n`;
  code += `${indent}user_record = await get_user_from_db(user_id)\n`;
  code += `${indent}if not user_record:\n`;
  code += `${indent}    user_record = user_data.get(user_id, {})\n`;
  code += `${indent}user_data_dict = user_record if user_record else user_data.get(user_id, {})\n`;
  code += generateConditionalMessageLogic(conditionalMessages, indent);
  code += `${indent}\n`;
  
  return code;
}
