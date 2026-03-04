/**
 * @fileoverview Генерация кода для получения переменных из базы данных
 *
 * Этот модуль предоставляет функции для генерации Python-кода,
 * который получает переменные из базы данных user_ids и добавляет
 * их в user_vars для использования в шаблонах сообщений.
 *
 * @module generateDatabaseVariables
 */

import { processCodeWithAutoComments } from '../utils/generateGeneratedComment';

/**
 * Генерирует Python код для получения списка ID из базы user_ids
 *
 * @param {string} indent - Отступ для кода
 * @returns {string} Сгенерированный код
 */
export function generateDatabaseVariablesCode(indent: string = '        '): string {
  const codeLines: string[] = [];

  codeLines.push(`${indent}# ┌─────────────────────────────────────────┐`);
  codeLines.push(`${indent}# │    Переменные из базы данных (user_ids) │`);
  codeLines.push(`${indent}# └─────────────────────────────────────────┘`);
  codeLines.push(`${indent}# Получаем список всех ID из базы user_ids`);
  codeLines.push(`${indent}try:`);
  codeLines.push(`${indent}    async with db_pool.acquire() as conn:`);
  codeLines.push(`${indent}        rows = await conn.fetch(`);
  codeLines.push(`${indent}            "SELECT user_id FROM user_ids ORDER BY created_at DESC"`);
  codeLines.push(`${indent}        )`);
  codeLines.push(`${indent}        # Формируем список ID в столбик`);
  codeLines.push(`${indent}        user_ids_list = "\\n".join(str(row["user_id"]) for row in rows)`);
  codeLines.push(`${indent}        # Количество ID`);
  codeLines.push(`${indent}        user_ids_count = len(rows)`);
  codeLines.push(`${indent}        logging.info(f"✅ Получено {user_ids_count} ID из базы user_ids")`);
  codeLines.push(`${indent}except Exception as e:`);
  codeLines.push(`${indent}    logging.error(f"❌ Ошибка получения ID из базы: {e}")`);
  codeLines.push(`${indent}    user_ids_list = "нет ID"`);
  codeLines.push(`${indent}    user_ids_count = 0`);
  codeLines.push(`${indent}    `);
  codeLines.push(`${indent}# Добавляем переменные базы данных в all_user_vars`);
  codeLines.push(`${indent}all_user_vars["user_ids_list"] = user_ids_list`);
  codeLines.push(`${indent}all_user_vars["user_ids_count"] = user_ids_count`);
  codeLines.push(`${indent}logging.info(f"🔧 Переменные базы данных добавлены в all_user_vars: user_ids_list={user_ids_list[:100] if len(user_ids_list) > 100 else user_ids_list}, user_ids_count={user_ids_count}")`);

  // Применяем автоматическое добавление комментариев
  const processedCode = processCodeWithAutoComments(codeLines, 'generateDatabaseVariables.ts');
  return processedCode.join('\n');
}
