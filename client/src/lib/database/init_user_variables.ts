/**
 * @fileoverview Утилита для генерации кода функции инициализации пользовательских переменных
 *
 * Этот модуль предоставляет функцию для генерации Python-кода,
 * реализующего функцию инициализации пользовательских переменных.
 *
 * @module init_user_variables
 */

import { processCodeWithAutoComments } from '../utils/generateGeneratedComment';

/**
 * Генерирует код функции инициализации пользовательских переменных
 * @param {string[]} codeLines - Массив строк для добавления сгенерированного кода
 * @param {string} indentLevel - уровень отступа для генерируемого кода
 */
export function init_user_variables(codeLines: string[], indentLevel: string = '') {
  const initUserCodeLines: string[] = [];

  initUserCodeLines.push(`${indentLevel}def init_user_variables(user_id, user_obj):`);
  initUserCodeLines.push(`${indentLevel}    """Инициализирует базовые переменные пользователя из Telegram API`);
  initUserCodeLines.push(`${indentLevel}    `);
  initUserCodeLines.push(`${indentLevel}    Args:`);
  initUserCodeLines.push(`${indentLevel}        user_id (int): ID пользователя Telegram`);
  initUserCodeLines.push(`${indentLevel}        user_obj: Объект пользователя из aiogram (message.from_user или callback_query.from_user)`);
  initUserCodeLines.push(`${indentLevel}    `);
  initUserCodeLines.push(`${indentLevel}    Returns:`);
  initUserCodeLines.push(`${indentLevel}        str: Имя пользователя для отображения (приоритет: first_name > username > "Пользователь")`);
  initUserCodeLines.push(`${indentLevel}    """`);
  initUserCodeLines.push(`${indentLevel}    # Инициализируем пользовательские данные если их нет`);
  initUserCodeLines.push(`${indentLevel}    if user_id not in user_data:`);
  initUserCodeLines.push(`${indentLevel}        user_data[user_id] = {}`);
  initUserCodeLines.push(`${indentLevel}    `);
  initUserCodeLines.push(`${indentLevel}    # Безопасно извлекаем данные из Telegram API`);
  initUserCodeLines.push(`${indentLevel}    username = user_obj.username if hasattr(user_obj, "username") else None`);
  initUserCodeLines.push(`${indentLevel}    first_name = user_obj.first_name if hasattr(user_obj, "first_name") else None`);
  initUserCodeLines.push(`${indentLevel}    last_name = user_obj.last_name if hasattr(user_obj, "last_name") else None`);
  initUserCodeLines.push(`${indentLevel}    `);
  initUserCodeLines.push(`${indentLevel}    # Определяем отображаемое имя по приоритету`);
  initUserCodeLines.push(`${indentLevel}    user_name = first_name or username or "Пользователь"`);
  initUserCodeLines.push(`${indentLevel}    `);
  initUserCodeLines.push(`${indentLevel}    # Сохраняем все переменные в пользовательские данные`);
  initUserCodeLines.push(`${indentLevel}    user_data[user_id]["user_name"] = user_name`);
  initUserCodeLines.push(`${indentLevel}    user_data[user_id]["first_name"] = first_name`);
  initUserCodeLines.push(`${indentLevel}    user_data[user_id]["last_name"] = last_name`);
  initUserCodeLines.push(`${indentLevel}    user_data[user_id]["username"] = username`);
  initUserCodeLines.push(`${indentLevel}    `);
  initUserCodeLines.push(`${indentLevel}    # Логируем инициализацию для отладки`);
  initUserCodeLines.push(`${indentLevel}    logging.info(f"✅ Инициализированы переменные пользователя {user_id}: user_name='{user_name}', first_name='{first_name}', username='{username}'")`);
  initUserCodeLines.push(`${indentLevel}    `);
  initUserCodeLines.push(`${indentLevel}    return user_name`);

  // Применяем автоматическое добавление комментариев ко всему коду
  const commentedCodeLines = processCodeWithAutoComments(initUserCodeLines, 'init_user_variables.ts');

  // Добавляем обработанные строки в исходный массив
  codeLines.push(...commentedCodeLines);
}
