/**
 * @fileoverview Утилита для генерации кода функции сохранения пользовательских данных в базу данных
 *
 * Этот модуль предоставляет функцию для генерации Python-кода,
 * реализующего функцию сохранения пользовательских данных в базу данных.
 * Является алиасом для update_user_data_in_db для обратной совместимости.
 *
 * @module save_user_data_to_db
 */

import { processCodeWithAutoComments } from '../utils/generateGeneratedComment';

/**
 * Добавляет в код функцию для сохранения пользовательских данных в базу данных
 * @param {string[]} codeLines - Массив строк кода, в который будет добавлена функция
 */
export function save_user_data_to_db(codeLines: string[]) {
    const saveUserDataCodeLines: string[] = [];

    saveUserDataCodeLines.push('async def save_user_data_to_db(user_id: int, data_key: str, data_value):');
    saveUserDataCodeLines.push('    """Алиас для update_user_data_in_db для обратной совместимости"""');
    saveUserDataCodeLines.push('    return await update_user_data_in_db(user_id, data_key, data_value)');
    saveUserDataCodeLines.push('');

    // Применяем автоматическое добавление комментариев ко всему коду
    const commentedCodeLines = processCodeWithAutoComments(saveUserDataCodeLines, 'save_user_data_to_db.ts');

    // Добавляем обработанные строки в исходный массив
    codeLines.push(...commentedCodeLines);
}
