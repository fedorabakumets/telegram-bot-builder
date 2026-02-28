/**
 * @fileoverview Генерация кода для условных сообщений
 * 
 * Модуль создаёт Python-код для проверки условий и выбора
 * соответствующего сообщения на основе данных пользователя.
 * 
 * @module bot-generator/transitions/generate-conditional-messages
 */

import { generateConditionalMessageLogic } from '../../Conditional';
import { formatTextForPython } from '../format';

/**
 * Генерирует Python-код для условных сообщений
 * 
 * @param node - Узел сообщения с условными данными
 * @param indent - Отступ для форматирования кода
 * @returns Сгенерированный Python-код
 */
export function generateConditionalMessages(
  node: any,
  indent: string = '                '
): string {
  let code = '';
  const messageText = node.data.messageText || 'Сообщение';
  const formattedText = formatTextForPython(messageText);
  
  code += `${indent}# Проверяем условные сообщения\n`;
  code += `${indent}text = None\n`;
  code += `${indent}\n`;
  code += `${indent}# Получаем данные пользователя для проверки условий\n`;
  code += `${indent}user_record = await get_user_from_db(user_id)\n`;
  code += `${indent}if not user_record:\n`;
  code += `${indent}    user_record = user_data.get(user_id, {})\n`;
  code += `${indent}\n`;
  code += `${indent}# Безопасно извлекаем user_data\n`;
  code += `${indent}if isinstance(user_record, dict):\n`;
  code += `${indent}    if "user_data" in user_record and isinstance(user_record["user_data"], dict):\n`;
  code += `${indent}        user_data_dict = user_record["user_data"]\n`;
  code += `${indent}    else:\n`;
  code += `${indent}        user_data_dict = user_record\n`;
  code += `${indent}else:\n`;
  code += `${indent}    user_data_dict = {}\n`;
  code += `${indent}\n`;
  
  code += generateConditionalMessageLogic(node.data.conditionalMessages, indent);
  
  code += `${indent}else:\n`;
  if (node.data.fallbackMessage) {
    const fallbackText = formatTextForPython(node.data.fallbackMessage);
    code += `${indent}    text = ${fallbackText}\n`;
    code += `${indent}    logging.info("Используется запасное сообщение")\n`;
  } else {
    code += `${indent}    text = ${formattedText}\n`;
    code += `${indent}    logging.info("Используется основное сообщение узла")\n`;
  }
  
  code += `${indent}\n`;
  
  return code;
}
