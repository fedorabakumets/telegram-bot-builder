/**
 * @fileoverview Утилита для генерации кода функции получения данных пользователя из базы данных
 *
 * Этот модуль предоставляет функцию для генерации Python-кода,
 * реализующего функцию получения данных пользователя из базы данных.
 *
 * @module get_user_from_db
 */

import { processCodeWithAutoComments } from '../utils/generateGeneratedComment';

/**
 * Добавляет в код функцию для получения данных пользователя из базы данных
 * @param {string[]} codeLines - Массив строк кода, в который будет добавлена функция
 */
export function get_user_from_db(codeLines: string[]) {
    const getUserCodeLines: string[] = [];

    getUserCodeLines.push('async def get_user_from_db(user_id: int):');
    getUserCodeLines.push('    """Получает данные пользователя из базы данных"""');
    getUserCodeLines.push('    if not db_pool:');
    getUserCodeLines.push('        return None');
    getUserCodeLines.push('    try:');
    getUserCodeLines.push('        async with db_pool.acquire() as conn:');
    getUserCodeLines.push('            row = await conn.fetchrow("SELECT * FROM bot_users WHERE user_id = $1", user_id)');
    getUserCodeLines.push('            if row:');
    getUserCodeLines.push('                # Преобразуем Record в словарь');
    getUserCodeLines.push('                row_dict = {key: row[key] for key in row.keys()}');
    getUserCodeLines.push('                # Если есть user_data, возвращаем его содержимое');
    getUserCodeLines.push('                if "user_data" in row_dict and row_dict["user_data"]:');
    getUserCodeLines.push('                    user_data = row_dict["user_data"]');
    getUserCodeLines.push('                    if isinstance(user_data, str):');
    getUserCodeLines.push('                        try:');
    getUserCodeLines.push('                            return json.loads(user_data)');
    getUserCodeLines.push('                        except (json.JSONDecodeError, TypeError):');
    getUserCodeLines.push('                            return {}');
    getUserCodeLines.push('                    elif isinstance(user_data, dict):');
    getUserCodeLines.push('                        return user_data');
    getUserCodeLines.push('                    else:');
    getUserCodeLines.push('                        return {}');
    getUserCodeLines.push('                # Если нет user_data, возвращаем полную запись');
    getUserCodeLines.push('                return row_dict');
    getUserCodeLines.push('        return None');
    getUserCodeLines.push('    except Exception as e:');
    getUserCodeLines.push('        logging.error(f"Ошибка получения пользователя из БД: {e}")');
    getUserCodeLines.push('        return None');
    getUserCodeLines.push('');

    // Применяем автоматическое добавление комментариев ко всему коду
    const commentedCodeLines = processCodeWithAutoComments(getUserCodeLines, 'get_user_from_db.ts');

    // Добавляем обработанные строки в исходный массив
    codeLines.push(...commentedCodeLines);
}
