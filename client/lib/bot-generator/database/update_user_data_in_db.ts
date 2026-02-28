/**
 * @fileoverview Утилита для генерации кода функции обновления пользовательских данных в базе данных
 *
 * Этот модуль предоставляет функцию для генерации Python-кода,
 * реализующего функцию обновления пользовательских данных в базе данных.
 *
 * @module update_user_data_in_db
 */

import { processCodeWithAutoComments } from '../utils/generateGeneratedComment';

/**
 * Добавляет в код функцию для обновления пользовательских данных в базе данных
 * @param {string[]} codeLines - Массив строк кода, в который будет добавлена функция
 */
export function update_user_data_in_db(codeLines: string[]) {
    const updateCodeLines: string[] = [];

    // Обновление данных пользователя в базе данных
    codeLines.push('# ┌─────────────────────────────────────────┐');
    codeLines.push('# │ Обновление данных пользователя в базе   │');
    codeLines.push('# │             данных                      │');
    codeLines.push('# └─────────────────────────────────────────┘');

    updateCodeLines.push('async def update_user_data_in_db(user_id: int, data_key: str, data_value):');
    updateCodeLines.push('    """Обновляет пользовательские данные в базе данных"""');
    updateCodeLines.push('    if not db_pool:');
    updateCodeLines.push('        return False');
    updateCodeLines.push('    try:');
    updateCodeLines.push('        async with db_pool.acquire() as conn:');
    updateCodeLines.push('            # Сначала создаём или получаем существующую запись');
    updateCodeLines.push('            await conn.execute("""');
    updateCodeLines.push('                INSERT INTO bot_users (user_id) ');
    updateCodeLines.push('                VALUES ($1) ');
    updateCodeLines.push('                ON CONFLICT (user_id) DO NOTHING');
    updateCodeLines.push('            """, user_id)');
    updateCodeLines.push('            ');
    updateCodeLines.push('            # Обновляем данные пользователя');
    updateCodeLines.push('            update_data = {data_key: data_value}');
    updateCodeLines.push('            await conn.execute("""');
    updateCodeLines.push('                UPDATE bot_users ');
    updateCodeLines.push('                SET user_data = COALESCE(user_data, \'{}\'' + '::jsonb) || $2::jsonb,');
    updateCodeLines.push('                    last_interaction = NOW()');
    updateCodeLines.push('                WHERE user_id = $1');
    updateCodeLines.push('            """, user_id, json.dumps(update_data))');
    updateCodeLines.push('        return True');
    updateCodeLines.push('    except Exception as e:');
    updateCodeLines.push('        logging.error(f"Ошибка обновления данных пользователя: {e}")');
    updateCodeLines.push('        return False');
    updateCodeLines.push('');

    // Применяем автоматическое добавление комментариев ко всему коду
    const commentedCodeLines = processCodeWithAutoComments(updateCodeLines, 'update_user_data_in_db.ts');

    // Добавляем обработанные строки в исходный массив
    codeLines.push(...commentedCodeLines);
}
