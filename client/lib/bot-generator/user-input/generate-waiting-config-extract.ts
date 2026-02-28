/**
 * @fileoverview Генерация извлечения конфигурации ожидания ввода
 * 
 * Модуль создаёт Python-код для извлечения данных из waiting_config
 * с поддержкой нового (dict) и старого (string) форматов.
 * 
 * @module bot-generator/user-input/generate-waiting-config-extract
 */

/**
 * Генерирует Python-код для извлечения конфигурации (новый формат dict)
 * 
 * @param indent - Отступ для форматирования кода
 * @returns Код извлечения конфигурации
 */
export function generateWaitingConfigExtract(
  indent: string = '            '
): string {
  let code = '';
  code += `${indent}# Новый формат - извлекаем данные из словаря\n`;
  code += `${indent}waiting_node_id = waiting_config.get("node_id")\n`;
  code += `${indent}input_type = waiting_config.get("type", "text")\n`;
  code += `${indent}variable_name = waiting_config.get("variable", "user_response")\n`;
  code += `${indent}save_to_database = waiting_config.get("save_to_database", False)\n`;
  code += `${indent}min_length = waiting_config.get("min_length", 0)\n`;
  code += `${indent}max_length = waiting_config.get("max_length", 0)\n`;
  code += `${indent}next_node_id = waiting_config.get("next_node_id")\n`;
  code += `${indent}    \n`;
  return code;
}

/**
 * Генерирует Python-код для проверки типа ввода медиа
 * 
 * @param indent - Отступ для форматирования кода
 * @returns Код проверки медиа типа
 */
export function generateMediaTypeCheck(
  indent: string = '            '
): string {
  let code = '';
  code += `${indent}# ИСПРАВЛЕНИЕ: Проверяем, является ли тип ввода медиа (фото, видео, аудио, документ)\n`;
  code += `${indent}# Если да, то текстовый обработчик не должен его обрабатывать\n`;
  code += `${indent}if input_type in ["photo", "video", "audio", "document"]:\n`;
  code += `${indent}    logging.info(f"Текстовый ввод от пользователя {user_id} проигнорирован - ожидается медиа ({input_type})")\n`;
  code += `${indent}    return\n`;
  return code;
}

/**
 * Генерирует Python-код для извлечения конфигурации (старый формат string)
 * 
 * @param indent - Отступ для форматирования кода
 * @returns Код извлечения старого формата
 */
export function generateWaitingConfigLegacyExtract(
  indent: string = '            '
): string {
  let code = '';
  code += `${indent}# Старый формат - waiting_config это строка с node_id\n`;
  code += `${indent}waiting_node_id = waiting_config\n`;
  code += `${indent}input_type = user_data[user_id].get("input_type", "text")\n`;
  code += `${indent}variable_name = user_data[user_id].get("input_variable", "user_response")\n`;
  code += `${indent}save_to_database = user_data[user_id].get("save_to_database", False)\n`;
  code += `${indent}min_length = 0\n`;
  code += `${indent}max_length = 0\n`;
  code += `${indent}next_node_id = user_data[user_id].get("waiting_input_target_node_id") or user_data[user_id].get("input_target_node_id")\n`;
  return code;
}
