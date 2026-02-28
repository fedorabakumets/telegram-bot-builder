/**
 * @fileoverview Подготовка текста сообщения и переменных БД
 *
 * Модуль генерирует Python-код для подготовки текста сообщения,
 * получения переменных из базы данных и замены переменных в тексте.
 *
 * @module bot-generator/transitions/message-preparation
 */

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
  code += `${indent}# Получаем переменные из базы данных\n`;
  code += `${indent}user_data_dict = await get_user_from_db(user_id) or {}\n`;
  code += `${indent}user_data_dict.update(user_data.get(user_id, {}))\n`;
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
  code += `${indent}user_vars = user_data_dict\n`;
  code += `${indent}text = replace_variables_in_text(text, user_vars)\n`;
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
