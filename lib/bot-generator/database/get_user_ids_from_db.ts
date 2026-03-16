/**
 * @fileoverview Утилита для генерации кода функции получения списка user_ids из базы данных
 *
 * Этот модуль предоставляет функцию для генерации Python-кода,
 * реализующего функцию получения списка ID пользователей из таблицы user_ids.
 *
 * @module get_user_ids_from_db
 */

import { processCodeWithAutoComments } from '../utils/generateGeneratedComment';

/**
 * Добавляет в код функцию для получения списка user_ids из таблицы user_ids
 * @param {string[]} codeLines - Массив строк кода, в который будет добавлена функция
 */
export function get_user_ids_from_db(codeLines: string[]) {
    const getUserIdsCodeLines: string[] = [];

    // Получение списка user_ids из таблицы user_ids
    codeLines.push('# ┌─────────────────────────────────────────┐');
    codeLines.push('# │ Получение данных пользователя из базы   │');
    codeLines.push('# │             данных                      │');
    codeLines.push('# └─────────────────────────────────────────┘');

    getUserIdsCodeLines.push('async def get_user_ids_from_db(user_id: int):');
    getUserIdsCodeLines.push('    """Получает список user_ids из таблицы user_ids');
    getUserIdsCodeLines.push('');
    getUserIdsCodeLines.push('    Args:');
    getUserIdsCodeLines.push('        user_id (int): ID пользователя Telegram');
    getUserIdsCodeLines.push('');
    getUserIdsCodeLines.push('    Returns:');
    getUserIdsCodeLines.push('        dict: Словарь с ключами "user_ids" (список) и "count" (количество)');
    getUserIdsCodeLines.push('    """');
    getUserIdsCodeLines.push('    if not db_pool:');
    getUserIdsCodeLines.push('        return {"user_ids": [], "count": 0}');
    getUserIdsCodeLines.push('    try:');
    getUserIdsCodeLines.push('        async with db_pool.acquire() as conn:');
    getUserIdsCodeLines.push('            rows = await conn.fetch("SELECT user_id FROM user_ids ORDER BY created_at DESC")');
    getUserIdsCodeLines.push('            user_ids = [str(row["user_id"]) for row in rows]');
    getUserIdsCodeLines.push('            count = len(rows)');
    getUserIdsCodeLines.push('            logging.info(f"✅ Получено {count} ID из таблицы user_ids")');
    getUserIdsCodeLines.push('            return {"user_ids": user_ids, "count": count}');
    getUserIdsCodeLines.push('    except Exception as e:');
    getUserIdsCodeLines.push('        logging.error(f"❌ Ошибка получения данных из user_ids: {e}")');
    getUserIdsCodeLines.push('        return {"user_ids": [], "count": 0}');
    getUserIdsCodeLines.push('');

    // Применяем автоматическое добавление комментариев ко всему коду
    const commentedCodeLines = processCodeWithAutoComments(getUserIdsCodeLines, 'get_user_ids_from_db.ts');

    // Добавляем обработанные строки в исходный массив
    codeLines.push(...commentedCodeLines);
}
