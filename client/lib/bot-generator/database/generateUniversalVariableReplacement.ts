/**
 * @fileoverview Генерация универсальной замены переменных
 *
 * Модуль создаёт Python-код для инициализации пользовательских переменных
 * и их замены в тексте сообщений.
 *
 * @module bot-generator/database/generateUniversalVariableReplacement
 */

import { processCodeWithAutoComments } from '../utils/generateGeneratedComment';
import { replace_variables_in_text } from './replace_variables_in_text';
import { isComponentGenerated, markComponentGenerated } from '../core/generation-state';

/**
 * Генерирует код для универсальной замены переменных
 *
 * @param codeLines - Массив строк кода для добавления
 * @param indentLevel - Уровень отступа
 */
export function generateUniversalVariableReplacement(
  codeLines: string[],
  indentLevel: string = ''
): void {
  const universalVarCodeLines: string[] = [];

  // Инициализация all_user_vars
  universalVarCodeLines.push(`${indentLevel}# Инициализируем all_user_vars пустым словарём`);
  universalVarCodeLines.push(`${indentLevel}all_user_vars = {}`);

  // Получаем переменные из БД
  universalVarCodeLines.push(`${indentLevel}# Получаем переменные из БД`);
  universalVarCodeLines.push(`${indentLevel}db_user_vars = await get_user_from_db(user_id)`);
  universalVarCodeLines.push(`${indentLevel}if not db_user_vars:`);
  universalVarCodeLines.push(`${indentLevel}    db_user_vars = user_data.get(user_id, {})`);

  // Проверяем что db_user_vars это dict
  universalVarCodeLines.push(`${indentLevel}# Проверяем что db_user_vars это dict`);
  universalVarCodeLines.push(`${indentLevel}if not isinstance(db_user_vars, dict):`);
  universalVarCodeLines.push(`${indentLevel}    db_user_vars = user_data.get(user_id, {})`);

  // Обновляем all_user_vars
  universalVarCodeLines.push(`${indentLevel}# Обновляем all_user_vars из БД`);
  universalVarCodeLines.push(`${indentLevel}if db_user_vars and isinstance(db_user_vars, dict):`);
  universalVarCodeLines.push(`${indentLevel}    all_user_vars.update(db_user_vars)`);

  // Получаем локальные переменные
  universalVarCodeLines.push(`${indentLevel}# Получаем локальные переменные из user_data`);
  universalVarCodeLines.push(`${indentLevel}local_user_vars = user_data.get(user_id, {})`);
  universalVarCodeLines.push(`${indentLevel}if isinstance(local_user_vars, dict):`);
  universalVarCodeLines.push(`${indentLevel}    all_user_vars.update(local_user_vars)`);

  // Добавляем функцию замены переменных (только если она еще не была сгенерирована)
  universalVarCodeLines.push(`${indentLevel}# Заменяем все переменные в тексте`);

  // Проверяем, была ли уже сгенерирована функция replace_variables_in_text
  if (true) {
    // Вызываем replace_variables_in_text с новой сигнатурой
    replace_variables_in_text(universalVarCodeLines, indentLevel);
    // Отмечаем, что функция была сгенерирована
    // marked as generated
  }

  // Добавляем универсальную замену переменных в тексте
  universalVarCodeLines.push(`${indentLevel}# Заменяем переменные в тексте, если text определена`);
  universalVarCodeLines.push(`${indentLevel}if 'text' not in locals():`);
  universalVarCodeLines.push(`${indentLevel}    text = ""  # Инициализируем пустым текстом если не определена`);
  universalVarCodeLines.push(`${indentLevel}text = replace_variables_in_text(text, all_user_vars)`);
  universalVarCodeLines.push('');

  // Применяем автоматическое добавление комментариев ко всему коду
  const commentedCodeLines = processCodeWithAutoComments(universalVarCodeLines, 'generateUniversalVariableReplacement.ts');

  // Добавляем обработанные строки в исходный массив
  codeLines.push(...commentedCodeLines);
}
