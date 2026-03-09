/**
 * @fileoverview Универсальное сохранение в таблицы БД
 *
 * Модуль предоставляет функцию для генерации Python-кода сохранения
 * переменных в произвольные таблицы БД (user_ids, user_telegram_settings, etc.).
 *
 * @module bot-generator/database/save-to-table
 */

import { processCodeWithAutoComments } from '../utils/generateGeneratedComment';

/**
 * Параметры для сохранения в таблицу
 */
export interface SaveToTableParams {
  table: string;
  column: string;
  valueExpression: string;
  indent?: string;
  appendExpression?: string;
  isDynamicAppend?: boolean;
}

/**
 * Генерирует код сохранения в таблицу БД
 *
 * @param params - Параметры генерации
 * @returns Строка с Python-кодом
 */
export function generateSaveToTable(params: SaveToTableParams): string {
  const {
    table,
    column,
    valueExpression,
    indent = '    ',
    appendExpression,
    isDynamicAppend = false
  } = params;

  const codeLines: string[] = [];
  const isAppend = isDynamicAppend
    ? appendExpression!
    : (appendExpression === 'True');

  codeLines.push(`${indent}# Сохраняем в таблицу ${table}`);
  codeLines.push(`${indent}try:`);
  codeLines.push(`${indent}    async with db_pool.acquire() as conn:`);

  if (isDynamicAppend) {
    // Динамический appendMode
    codeLines.push(`${indent}    if ${appendExpression}:`);
    codeLines.push(`${indent}        # appendVariable: всегда добавляем новую запись`);
    codeLines.push(`${indent}        await conn.execute(`);
    codeLines.push(`${indent}            "INSERT INTO ${table} (user_id, ${column}) VALUES ($1, NOW())",`);
    codeLines.push(`${indent}            ${valueExpression}`);
    codeLines.push(`${indent}        )`);
    codeLines.push(`${indent}        logging.info(f"✅ Добавлено в ${table}: {${valueExpression}}")`);
    codeLines.push(`${indent}    else:`);
    codeLines.push(`${indent}        # Обычный режим: проверяем существование`);
    codeLines.push(`${indent}        exists = await conn.fetchval("SELECT 1 FROM ${table} WHERE user_id = $1", ${valueExpression})`);
    codeLines.push(`${indent}        if not exists:`);
    codeLines.push(`${indent}            await conn.execute(`);
    codeLines.push(`${indent}                "INSERT INTO ${table} (user_id, ${column}) VALUES ($1, NOW())",`);
    codeLines.push(`${indent}                ${valueExpression}`);
    codeLines.push(`${indent}            )`);
    codeLines.push(`${indent}            logging.info(f"✅ Добавлено в ${table}: {${valueExpression}}")`);
    codeLines.push(`${indent}        else:`);
    codeLines.push(`${indent}            logging.info(f"ℹ️ Запись уже существует в ${table}: {${valueExpression}}")`);
  } else if (isAppend) {
    // Статический appendMode = True
    codeLines.push(`${indent}    # appendVariable: всегда добавляем новую запись`);
    codeLines.push(`${indent}    await conn.execute(`);
    codeLines.push(`${indent}        "INSERT INTO ${table} (user_id, ${column}) VALUES ($1, NOW())",`);
    codeLines.push(`${indent}        ${valueExpression}`);
    codeLines.push(`${indent}    )`);
    codeLines.push(`${indent}    logging.info(f"✅ Добавлено в ${table}: {${valueExpression}}")`);
  } else {
    // Обычный режим
    codeLines.push(`${indent}    # Проверяем существование записи`);
    codeLines.push(`${indent}    exists = await conn.fetchval("SELECT 1 FROM ${table} WHERE user_id = $1", ${valueExpression})`);
    codeLines.push(`${indent}    if not exists:`);
    codeLines.push(`${indent}        # Добавляем новую запись`);
    codeLines.push(`${indent}        await conn.execute(`);
    codeLines.push(`${indent}            "INSERT INTO ${table} (user_id, ${column}) VALUES ($1, NOW())",`);
    codeLines.push(`${indent}            ${valueExpression}`);
    codeLines.push(`${indent}        )`);
    codeLines.push(`${indent}        logging.info(f"✅ Добавлено в ${table}: {${valueExpression}}")`);
    codeLines.push(`${indent}    else:`);
    codeLines.push(`${indent}        logging.info(f"ℹ️ Запись уже существует в ${table}: {${valueExpression}}")`);
  }

  codeLines.push(`${indent}except Exception as e:`);
  codeLines.push(`${indent}    logging.error(f"❌ Ошибка сохранения в ${table}: {e}")`);

  return processCodeWithAutoComments(codeLines, 'save-to-table.ts').join('\n');
}
