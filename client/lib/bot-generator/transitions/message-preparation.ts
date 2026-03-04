/**
 * @fileoverview Подготовка текста сообщения и переменных БД
 *
 * Модуль генерирует Python-код для подготовки текста сообщения,
 * получения переменных из базы данных и замены переменных в тексте.
 *
 * @module bot-generator/transitions/message-preparation
 */

import { generateDatabaseVariablesCode } from '../Broadcast/generateDatabaseVariables';

/**
 * Параметры для подготовки сообщения
 */
export interface MessagePreparationParams {
  /** ID узла */
  nodeId: string;
  /** Текст сообщения */
  messageText?: string;
  /** Есть ли переменная ввода */
  hasInputVariable?: boolean;
  /** Имя переменной ввода */
  inputVariable?: string;
}

/**
 * Генерирует код подготовки текста сообщения
 *
 * @param params - Параметры подготовки
 * @param indent - Отступ для кода
 * @returns Сгенерированный Python-код
 */
export function generateMessageText(messageText?: string, indent: string = '    '): string {
  const text = messageText || 'Сообщение';
  const escapedText = text.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
  return `${indent}text = "${escapedText}"\n`;
}

/**
 * Генерирует код получения переменных из БД
 *
 * @param indent - Отступ для кода
 * @returns Сгенерированный Python-код
 */
export function generateDatabaseVarsGet(indent: string = '    '): string {
  let code = '';
  code += `${indent}# Инициализируем all_user_vars пустым словарём\n`;
  code += `${indent}all_user_vars = {}\n`;
  code += `${indent}# Получаем переменные из БД\n`;
  code += `${indent}db_user_vars = await get_user_from_db(user_id)\n`;
  code += `${indent}if not db_user_vars:\n`;
  code += `${indent}    db_user_vars = user_data.get(user_id, {})\n`;
  code += `${indent}# Проверяем что db_user_vars это dict\n`;
  code += `${indent}if not isinstance(db_user_vars, dict):\n`;
  code += `${indent}    db_user_vars = user_data.get(user_id, {})\n`;
  code += `${indent}# Обновляем all_user_vars из БД\n`;
  code += `${indent}if db_user_vars and isinstance(db_user_vars, dict):\n`;
  code += `${indent}    all_user_vars.update(db_user_vars)\n`;
  code += `${indent}# Получаем локальные переменные из user_data\n`;
  code += `${indent}local_user_vars = user_data.get(user_id, {})\n`;
  code += `${indent}if isinstance(local_user_vars, dict):\n`;
  code += `${indent}    all_user_vars.update(local_user_vars)\n`;
  code += `${indent}\n`;
  code += `${indent}# Получаем переменные из базы данных (user_ids_list, user_ids_count)\n`;
  code += generateDatabaseVariablesCode(indent);
  return code;
}

/**
 * Генерирует код замены переменных в тексте
 *
 * @param indent - Отступ для кода
 * @returns Сгенерированный Python-код
 */
export function generateVariableReplacement(indent: string = '    '): string {
  let code = '';
  code += `${indent}# Заменяем переменные в тексте\n`;
  code += `${indent}text = replace_variables_in_text(text, all_user_vars)\n`;
  return code;
}

/**
 * Генерирует полный код подготовки сообщения
 *
 * @param params - Параметры подготовки
 * @param indent - Отступ для кода
 * @returns Сгенерированный Python-код
 */
export function generateFullMessagePreparation(
  params: MessagePreparationParams,
  indent: string = '    '
): string {
  let code = '';

  // Подготовка текста
  code += generateMessageText(params.messageText, indent);
  code += '\n';

  // Получение переменных из БД
  code += generateDatabaseVarsGet(indent);
  code += '\n';

  // Замена переменных
  code += generateVariableReplacement(indent);

  return code;
}
