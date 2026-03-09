/**
 * @fileoverview Универсальный генератор кода для получения переменных из таблиц БД
 * Использует конфигурацию SYSTEM_VARIABLE_SOURCES для генерации кода
 * @module generate-database-variables-universal
 */

import { SYSTEM_VARIABLE_SOURCES } from '@shared/system-variables-config';
import { processCodeWithAutoComments } from '../utils/generateGeneratedComment';

/**
 * Генерирует Python код для получения переменных из всех таблиц БД
 * @param {string} indent - Отступ для кода
 * @param {string[]} usedVariables - Список используемых переменных (опционально)
 * @returns {string} Сгенерированный код
 */
export function generateDatabaseVariablesCode(indent: string = '        ', usedVariables?: string[]): string {
  const codeLines: string[] = [];

  codeLines.push(`${indent}# ┌─────────────────────────────────────────┐`);
  codeLines.push(`${indent}# │    Переменные из таблиц базы данных     │`);
  codeLines.push(`${indent}# └─────────────────────────────────────────┘`);

  // Генерируем код для каждой таблицы
  SYSTEM_VARIABLE_SOURCES.forEach(source => {
    const tableVariables = source.fields.map(f => f.variableName);
    const needsTable = !usedVariables || usedVariables.some(v => tableVariables.includes(v));

    if (!needsTable) {
      codeLines.push(`${indent}# Таблица: ${source.table} — не требуется`);
      return;
    }

    codeLines.push(`${indent}# Таблица: ${source.table}`);
    codeLines.push(`${indent}# ${source.description}`);

    if (source.table === 'user_ids') {
      // user_id - BIGINT (integer)
      codeLines.push(`${indent}try:`);
      codeLines.push(`${indent}    async with db_pool.acquire() as conn:`);
      codeLines.push(`${indent}        rows = await conn.fetch("SELECT user_id FROM user_ids ORDER BY created_at DESC")`);
      codeLines.push(`${indent}        user_ids = [str(row["user_id"]) for row in rows]`);
      codeLines.push(`${indent}        user_ids_count = len(rows)`);
      codeLines.push(`${indent}        logging.info(f"✅ Получено {user_ids_count} ID из таблицы user_ids")`);
      codeLines.push(`${indent}except Exception as e:`);
      codeLines.push(`${indent}    logging.error(f"❌ Ошибка получения данных из user_ids: {e}")`);
      codeLines.push(`${indent}    user_ids = []`);
      codeLines.push(`${indent}    user_ids_count = 0`);

    } else if (source.table === 'bot_users') {
      codeLines.push(`${indent}# Переменные из bot_users инициализируются в init_user_variables()`);

    } else if (source.table === 'user_telegram_settings') {
      // user_id - TEXT (строка), используем 'default' для общей базы credentials
      codeLines.push(`${indent}try:`);
      codeLines.push(`${indent}    async with db_pool.acquire() as conn:`);
      codeLines.push(`${indent}        # Загружаем настройки из общей базы ('default')`);
      codeLines.push(`${indent}        row = await conn.fetchrow("SELECT * FROM user_telegram_settings WHERE user_id = 'default'")`);
      codeLines.push(`${indent}        if row:`);
      source.fields.forEach(field => {
        codeLines.push(`${indent}            ${field.variableName} = row["${field.column}"]`);
      });
      codeLines.push(`${indent}        else:`);
      source.fields.forEach(field => {
        codeLines.push(`${indent}            ${field.variableName} = None`);
      });
      codeLines.push(`${indent}        logging.info(f"✅ Получены настройки Telegram из user_telegram_settings")`);
      codeLines.push(`${indent}except Exception as e:`);
      codeLines.push(`${indent}    logging.error(f"❌ Ошибка получения настроек Telegram: {e}")`);
      source.fields.forEach(field => {
        codeLines.push(`${indent}    ${field.variableName} = None`);
      });
    }

    codeLines.push('');
  });

  // Добавляем переменные в all_user_vars
  codeLines.push(`${indent}# Добавляем переменные базы данных в all_user_vars`);
  SYSTEM_VARIABLE_SOURCES.forEach(source => {
    if (source.table === 'bot_users') return;

    const tableVariables = source.fields.map(f => f.variableName);
    const needsTable = !usedVariables || usedVariables.some(v => tableVariables.includes(v));
    if (!needsTable) return;

    source.fields.forEach(field => {
      codeLines.push(`${indent}all_user_vars["${field.variableName}"] = ${field.variableName}`);
    });
  });

  codeLines.push(`${indent}logging.info(f"🔧 Переменные из БД добавлены в all_user_vars")`);

  const processedCode = processCodeWithAutoComments(codeLines, 'generate-database-variables-universal.ts');
  return processedCode.join('\n');
}
