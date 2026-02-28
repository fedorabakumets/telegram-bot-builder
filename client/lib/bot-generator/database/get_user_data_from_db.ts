/**
 * @fileoverview Утилита для генерации кода функции получения конкретного значения из поля user_data пользователя
 *
 * Этот модуль предоставляет функцию для генерации Python-кода,
 * реализующего функцию получения конкретного значения из поля user_data пользователя.
 *
 * @module get_user_data_from_db
 */

import { processCodeWithAutoComments } from '../utils/generateGeneratedComment';

/**
 * Добавляет в код функцию для получения конкретного значения из поля user_data пользователя
 * @param {string[]} codeLines - Массив строк кода, в который будет добавлена функция
 */
export function get_user_data_from_db(codeLines: string[]) {
    const getUserDataCodeLines: string[] = [];

    // Получение данных пользователя из базы данных
    codeLines.push('# ┌─────────────────────────────────────────┐');
    codeLines.push('# │ Получение данных пользователя из базы   │');
    codeLines.push('# │             данных                      │');
    codeLines.push('# └─────────────────────────────────────────┘');

    getUserDataCodeLines.push('async def get_user_data_from_db(user_id: int, data_key: str):');
    getUserDataCodeLines.push('    """Получает конкретное значение из поля user_data пользователя"""');
    getUserDataCodeLines.push('    if not db_pool:');
    getUserDataCodeLines.push('        return None');
    getUserDataCodeLines.push('    try:');
    getUserDataCodeLines.push('        async with db_pool.acquire() as conn:');
    getUserDataCodeLines.push('            # Используем оператор ->> для получения значения поля JSONB как текста');
    getUserDataCodeLines.push('            value = await conn.fetchval(');
    getUserDataCodeLines.push('                "SELECT user_data ->> $2 FROM bot_users WHERE user_id = $1",');
    getUserDataCodeLines.push('                user_id,');
    getUserDataCodeLines.push('                data_key');
    getUserDataCodeLines.push('            )');
    getUserDataCodeLines.push('            return value');
    getUserDataCodeLines.push('    except Exception as e:');
    getUserDataCodeLines.push('        logging.error(f"Ошибка получения данных пользователя из БД: {e}")');
    getUserDataCodeLines.push('        return None');
    getUserDataCodeLines.push('');

    // Применяем автоматическое добавление комментариев ко всему коду
    const commentedCodeLines = processCodeWithAutoComments(getUserDataCodeLines, 'get_user_data_from_db.ts');

    // Добавляем обработанные строки в исходный массив
    codeLines.push(...commentedCodeLines);
}
