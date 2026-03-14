/**
 * @fileoverview Сохранение переменных в bot_users.user_data (JSONB)
 *
 * Модуль предоставляет функцию для генерации Python-кода сохранения
 * переменных в таблицу bot_users в поле user_data (JSONB).
 *
 * @module bot-generator/database/save-to-bot-users
 */

import { processCodeWithAutoComments } from '../utils/generateGeneratedComment';

/**
 * Параметры для сохранения в bot_users
 */
export interface SaveToBotUsersParams {
  variableName: string;
  valueExpression: string;
  indent?: string;
  appendExpression?: string;
  isVariableNameDynamic?: boolean;
}

/**
 * Генерирует код сохранения в bot_users.user_data
 *
 * @param params - Параметры генерации
 * @returns Строка с Python-кодом
 */
export function generateSaveToBotUsers(params: SaveToBotUsersParams): string {
  const {
    variableName,
    valueExpression,
    indent = '    ',
    appendExpression,
    isVariableNameDynamic = false
  } = params;

  const codeLines: string[] = [];
  const varRef = isVariableNameDynamic ? variableName : `"${variableName}"`;
  const updateVarName = isVariableNameDynamic ? variableName : `"${variableName}"`;

  codeLines.push(`${indent}# Сохраняем в bot_users.user_data`);

  if (appendExpression) {
    // Динамический appendMode
    codeLines.push(`${indent}if ${appendExpression}:`);
    codeLines.push(`${indent}    if ${varRef} not in user_data[user_id]:`);
    codeLines.push(`${indent}        user_data[user_id][${varRef}] = []`);
    codeLines.push(`${indent}    user_data[user_id][${varRef}].append(${valueExpression})`);
    codeLines.push(`${indent}    db_value = user_data[user_id][${varRef}]`);
    codeLines.push(`${indent}else:`);
    codeLines.push(`${indent}    user_data[user_id][${varRef}] = ${valueExpression}`);
    codeLines.push(`${indent}    db_value = ${valueExpression}`);
  } else {
    // Статический режим
    codeLines.push(`${indent}user_data[user_id][${varRef}] = ${valueExpression}`);
    codeLines.push(`${indent}db_value = ${valueExpression}`);
  }

  codeLines.push(`${indent}await update_user_data_in_db(user_id, ${updateVarName}, db_value)`);

  return processCodeWithAutoComments(codeLines, 'save-to-bot-users.ts').join('\n');
}

/**
 * Генерирует универсальный код сохранения (бот + любые таблицы)
 * Для использования когда имя переменной неизвестно на этапе генерации
 */
export function generateSaveToDatabaseUniversal(params: SaveToBotUsersParams): string {
  const {
    variableName,
    valueExpression,
    indent = '    ',
    appendExpression,
  } = params;

  const codeLines: string[] = [];

  codeLines.push(`${indent}# Универсальное сохранение (бот + таблицы)`);
  codeLines.push(`${indent}# Определяем таблицу по имени переменной и сохраняем`);
  
  // Генерируем проверки для всех таблиц кроме bot_users
  codeLines.push(`${indent}if ${variableName} == "user_ids":`);
  codeLines.push(`${indent}    await _save_to_user_ids(${variableName}, ${valueExpression}, ${appendExpression}, user_id)`);
  codeLines.push(`${indent}    all_user_vars[${variableName}] = ${valueExpression}`);
  codeLines.push(`${indent}elif ${variableName} == "tg_api_id":`);
  codeLines.push(`${indent}    await _save_to_user_telegram_settings(${variableName}, "api_id", ${valueExpression}, user_id)`);
  codeLines.push(`${indent}    all_user_vars[${variableName}] = ${valueExpression}`);
  codeLines.push(`${indent}elif ${variableName} == "tg_api_hash":`);
  codeLines.push(`${indent}    await _save_to_user_telegram_settings(${variableName}, "api_hash", ${valueExpression}, user_id)`);
  codeLines.push(`${indent}    all_user_vars[${variableName}] = ${valueExpression}`);
  codeLines.push(`${indent}elif ${variableName} == "tg_phone":`);
  codeLines.push(`${indent}    await _save_to_user_telegram_settings(${variableName}, "phone_number", ${valueExpression}, user_id)`);
  codeLines.push(`${indent}    all_user_vars[${variableName}] = ${valueExpression}`);
  codeLines.push(`${indent}elif ${variableName} == "tg_session":`);
  codeLines.push(`${indent}    await _save_to_user_telegram_settings(${variableName}, "session_string", ${valueExpression}, user_id)`);
  codeLines.push(`${indent}    all_user_vars[${variableName}] = ${valueExpression}`);
  codeLines.push(`${indent}elif ${variableName} == "tg_is_active":`);
  codeLines.push(`${indent}    await _save_to_user_telegram_settings(${variableName}, "is_active", ${valueExpression}, user_id)`);
  codeLines.push(`${indent}    all_user_vars[${variableName}] = ${valueExpression}`);
  codeLines.push(`${indent}else:`);
  codeLines.push(`${indent}    # Сохраняем в bot_users.user_data`);
  codeLines.push(`${indent}    if ${appendExpression}:`);
  codeLines.push(`${indent}        if ${variableName} not in user_data[user_id]:`);
  codeLines.push(`${indent}            user_data[user_id][${variableName}] = []`);
  codeLines.push(`${indent}        user_data[user_id][${variableName}].append(${valueExpression})`);
  codeLines.push(`${indent}        db_value = user_data[user_id][${variableName}]`);
  codeLines.push(`${indent}    else:`);
  codeLines.push(`${indent}        user_data[user_id][${variableName}] = ${valueExpression}`);
  codeLines.push(`${indent}        db_value = ${valueExpression}`);
  codeLines.push(`${indent}    await update_user_data_in_db(user_id, ${variableName}, db_value)`);
  codeLines.push(`${indent}    all_user_vars[${variableName}] = db_value`);

  return processCodeWithAutoComments(codeLines, 'save-to-bot-users.ts').join('\n');
}

/**
 * Генерирует код вспомогательных функций для сохранения в таблицы
 */
export function generateSaveHelperFunctions(indent: string = ''): string {
  const lines: string[] = [];
  
  // Функция для user_ids
  lines.push(`${indent}async def _save_to_user_ids(var_name, value, append_mode, user_id):`);
  lines.push(`${indent}    """Сохраняет user_id в таблицу user_ids"""`);
  lines.push(`${indent}    global all_user_vars`);
  lines.push(`${indent}    try:`);
  lines.push(`${indent}        user_id_value = int(value) if isinstance(value, str) else value`);
  lines.push(`${indent}        async with db_pool.acquire() as conn:`);
  lines.push(`${indent}            if append_mode:`);
  lines.push(`${indent}                await conn.execute(`);
  lines.push(`${indent}                    "INSERT INTO user_ids (user_id, created_at) VALUES ($1, NOW())",`);
  lines.push(`${indent}                    user_id_value`);
  lines.push(`${indent}                )`);
  lines.push(`${indent}            else:`);
  lines.push(`${indent}                exists = await conn.fetchval("SELECT 1 FROM user_ids WHERE user_id = $1", user_id_value)`);
  lines.push(`${indent}                if not exists:`);
  lines.push(`${indent}                    await conn.execute(`);
  lines.push(`${indent}                        "INSERT INTO user_ids (user_id, created_at) VALUES ($1, NOW())",`);
  lines.push(`${indent}                        user_id_value`);
  lines.push(`${indent}                    )`);
  lines.push(`${indent}        # Обновляем all_user_vars`);
  lines.push(`${indent}        async with db_pool.acquire() as conn:`);
  lines.push(`${indent}            rows = await conn.fetch("SELECT user_id FROM user_ids ORDER BY created_at DESC")`);
  lines.push(`${indent}            all_user_vars["user_ids"] = [str(row["user_id"]) for row in rows]`);
  lines.push(`${indent}            all_user_vars["user_ids_count"] = len(rows)`);
  lines.push(`${indent}    except Exception as e:`);
  lines.push(`${indent}        logging.error(f"❌ Ошибка сохранения в user_ids: {e}")`);
  lines.push(`${indent}    `);
  
  // Функция для user_telegram_settings
  lines.push(`${indent}async def _save_to_user_telegram_settings(var_name, column, value, user_id):`);
  lines.push(`${indent}    """Сохраняет настройки Telegram в таблицу user_telegram_settings"""`);
  lines.push(`${indent}    global all_user_vars`);
  lines.push(`${indent}    try:`);
  lines.push(`${indent}        # Используем 'default' для общей базы credentials`);
  lines.push(`${indent}        user_id_str = 'default'`);
  lines.push(`${indent}        async with db_pool.acquire() as conn:`);
  lines.push(`${indent}            # Проверяем существование записи`);
  lines.push(`${indent}            exists = await conn.fetchval(`);
  lines.push(`${indent}                "SELECT 1 FROM user_telegram_settings WHERE user_id = $1", user_id_str`);
  lines.push(`${indent}            )`);
  lines.push(`${indent}            if exists:`);
  lines.push(`${indent}                await conn.execute(`);
  lines.push(`${indent}                    f"UPDATE user_telegram_settings SET {column} = $2 WHERE user_id = $1",`);
  lines.push(`${indent}                    user_id_str, value`);
  lines.push(`${indent}                )`);
  lines.push(`${indent}            else:`);
  lines.push(`${indent}                await conn.execute(`);
  lines.push(`${indent}                    f"INSERT INTO user_telegram_settings (user_id, {column}) VALUES ($1, $2)",`);
  lines.push(`${indent}                    user_id_str, value`);
  lines.push(`${indent}                )`);
  lines.push(`${indent}        # Обновляем all_user_vars`);
  lines.push(`${indent}        all_user_vars[var_name] = value`);
  lines.push(`${indent}        logging.info(f"✅ Сохранено в user_telegram_settings: {var_name} = {value}")`);
  lines.push(`${indent}    except Exception as e:`);
  lines.push(`${indent}        logging.error(f"❌ Ошибка сохранения в user_telegram_settings: {e}")`);
  lines.push('');
  
  return lines.join('\n');
}
