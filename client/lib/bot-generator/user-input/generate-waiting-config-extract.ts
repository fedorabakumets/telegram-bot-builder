/**
 * @fileoverview Генерация извлечения конфигурации ожидания ввода
 *
 * Модуль создаёт Python-код для извлечения данных из waiting_config
 * с поддержкой нового формата (dict).
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
  code += `${indent}# Извлекаем конфигурацию из waiting_config (dict)\n`;
  code += `${indent}waiting_node_id = waiting_config.get("node_id")\n`;
  code += `${indent}input_type = waiting_config.get("type", "text")\n`;
  code += `${indent}variable_name = waiting_config.get("variable", "user_response")\n`;
  code += `${indent}save_to_database = waiting_config.get("save_to_database", False)\n`;
  code += `${indent}min_length = waiting_config.get("min_length", 0)\n`;
  code += `${indent}max_length = waiting_config.get("max_length", 0)\n`;
  code += `${indent}next_node_id = waiting_config.get("next_node_id")\n`;
  code += `${indent}appendVariable = waiting_config.get("appendVariable", False)\n`;
  code += `${indent}logging.info(f"DEBUG: input_type = {input_type}, variable_name = {variable_name}, next_node_id = {next_node_id}, appendVariable = {appendVariable}")\n`;
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
  code += `${indent}# Проверяем, является ли тип ввода медиа (фото, видео, аудио, документ)\n`;
  code += `${indent}# Если да, то текстовый обработчик не должен его обрабатывать\n`;
  code += `${indent}if input_type in ["photo", "video", "audio", "document"]:\n`;
  code += `${indent}    logging.info(f"Текстовый ввод от пользователя {user_id} проигнорирован - ожидается медиа ({input_type})")\n`;
  code += `${indent}    return\n`;
  return code;
}
