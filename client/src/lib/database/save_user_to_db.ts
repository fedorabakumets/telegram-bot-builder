/**
 * @fileoverview Утилита для генерации кода функции сохранения пользователя в базу данных
 *
 * Этот модуль предоставляет функцию для генерации Python-кода,
 * реализующего функцию сохранения пользователя в базу данных.
 *
 * @module save_user_to_db
 */

import { processCodeWithAutoComments } from '../utils/generateGeneratedComment';

/**
 * Добавляет в код функцию для сохранения пользователя в базу данных
 * @param {string[]} codeLines - Массив строк кода, в который будет добавлена функция
 */
export function save_user_to_db(codeLines: string[]) {
    const saveUserCodeLines: string[] = [];

    // Сохранение пользователя в базу данных
    codeLines.push('# ┌─────────────────────────────────────────┐');
    codeLines.push('# │    Сохранение пользователя в базу данных│');
    codeLines.push('# └─────────────────────────────────────────┘');

    saveUserCodeLines.push('async def save_user_to_db(user_id: int, username: Optional[str] = None, first_name: Optional[str] = None, last_name: Optional[str] = None):');
    saveUserCodeLines.push('    """Сохраняет пользователя в базу данных"""');
    saveUserCodeLines.push('    if not db_pool:');
    saveUserCodeLines.push('        return False');
    saveUserCodeLines.push('    try:');
    saveUserCodeLines.push('        async with db_pool.acquire() as conn:');
    saveUserCodeLines.push('            await conn.execute("""');
    saveUserCodeLines.push('                INSERT INTO bot_users (user_id, username, first_name, last_name)');
    saveUserCodeLines.push('                VALUES ($1, $2, $3, $4)');
    saveUserCodeLines.push('                ON CONFLICT (user_id) DO UPDATE SET');
    saveUserCodeLines.push('                    username = EXCLUDED.username,');
    saveUserCodeLines.push('                    first_name = EXCLUDED.first_name,');
    saveUserCodeLines.push('                    last_name = EXCLUDED.last_name,');
    saveUserCodeLines.push('                    last_interaction = NOW(),');
    saveUserCodeLines.push('                    interaction_count = bot_users.interaction_count + 1');
    saveUserCodeLines.push('            """, user_id, username, first_name, last_name)');
    saveUserCodeLines.push('        return True');
    saveUserCodeLines.push('    except Exception as e:');
    saveUserCodeLines.push('        logging.error(f"Ошибка сохранения пользователя в БД: {e}")');
    saveUserCodeLines.push('        return False');
    saveUserCodeLines.push('');

    // Применяем автоматическое добавление комментариев ко всему коду
    const commentedCodeLines = processCodeWithAutoComments(saveUserCodeLines, 'save_user_to_db.ts');

    // Добавляем обработанные строки в исходный массив
    codeLines.push(...commentedCodeLines);
}
