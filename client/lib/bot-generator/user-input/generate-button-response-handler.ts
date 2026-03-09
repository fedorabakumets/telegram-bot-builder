/**
 * @fileoverview Генерация обработчика кнопочных ответов reply
 * 
 * Модуль создаёт Python-код для обработки выбора пользователя
 * из reply клавиатуры с кнопками вариантов ответа.
 * 
 * @module bot-generator/user-input/generate-button-response-handler
 */

/**
 * Генерирует Python-код для проверки button_response_config
 * 
 * @param indent - Отступ для форматирования кода
 * @returns Начальная часть обработчика
 */
export function generateButtonResponseCheck(
  indent: string = '    '
): string {
  let code = '';
  code += `${indent}# Проверяем, ожидаем ли мы кнопочный ответ через reply клавиатуру\n`;
  code += `${indent}if user_id in user_data and "button_response_config" in user_data[user_id]:\n`;
  code += `${indent}    config = user_data[user_id]["button_response_config"]\n`;
  code += `${indent}    user_text = message.text\n`;
  code += `${indent}    \n`;
  return code;
}

/**
 * Генерирует Python-код для поиска выбранного варианта
 * 
 * @param indent - Отступ для форматирования кода
 * @returns Код поиска варианта
 */
export function generateSelectedOptionSearch(
  indent: string = '    '
): string {
  let code = '';
  code += `${indent}    # Ищем выбранный вариант среди доступных опций\n`;
  code += `${indent}    selected_option = None\n`;
  code += `${indent}    for option in config.get("options", []):\n`;
  code += `${indent}        if option["text"] == user_text:\n`;
  code += `${indent}            selected_option = option\n`;
  code += `${indent}            break\n`;
  code += `${indent}    \n`;
  return code;
}

/**
 * Генерирует Python-код для сохранения response_data
 *
 * @param indent - Отступ для форматирования кода
 * @returns Код сохранения данных
 */
export function generateResponseDataStructure(
  indent: string = '    '
): string {
  let code = '';
  code += `${indent}# Создаем структурированный ответ\n`;
  code += `${indent}response_data = {\n`;
  code += `${indent}    "value": selected_value,\n`;
  code += `${indent}    "text": selected_text,\n`;
  code += `${indent}    "type": "button_choice",\n`;
  code += `${indent}    "timestamp": timestamp,\n`;
  code += `${indent}    "nodeId": node_id,\n`;
  code += `${indent}    "variable": variable_name\n`;
  code += `${indent}}\n`;
  return code;
}
