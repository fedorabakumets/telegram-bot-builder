/**
 * @fileoverview Утилита для генерации кода функции логирования сообщений в базу данных
 *
 * Этот модуль предоставляет функцию для генерации Python-кода,
 * реализующего функцию логирования сообщений в базу данных.
 *
 * @module log_message
 */

import { processCodeWithAutoComments } from '../utils/generateGeneratedComment';

/**
 * Добавляет в код функцию для логирования сообщений в базу данных
 * @param {string[]} codeLines - Массив строк кода, в который будет добавлена функция
 */
export function log_message(codeLines: string[]) {
    const logMessageCodeLines: string[] = [];

    logMessageCodeLines.push('async def log_message(user_id: int, message_type: str, message_text: str = None, message_data: dict = None, node_id: str = None):');
    logMessageCodeLines.push('    """Логирует сообщение в базу данных"""');
    logMessageCodeLines.push('    if not db_pool:');
    logMessageCodeLines.push('        return False');
    logMessageCodeLines.push('    try:');
    logMessageCodeLines.push('        async with db_pool.acquire() as conn:');
    logMessageCodeLines.push('            await conn.execute("""');
    logMessageCodeLines.push('                INSERT INTO bot_messages (user_id, message_type, message_text, message_data, node_id)');
    logMessageCodeLines.push('                VALUES ($1, $2, $3, $4, $5)');
    logMessageCodeLines.push('            """, str(user_id), message_type, message_text, json.dumps(message_data) if message_data else None, node_id)');
    logMessageCodeLines.push('        return True');
    logMessageCodeLines.push('    except Exception as e:');
    logMessageCodeLines.push('        logging.error(f"Ошибка логирования сообщения: {e}")');
    logMessageCodeLines.push('        return False');
    logMessageCodeLines.push('');

    // Применяем автоматическое добавление комментариев ко всему коду
    const commentedCodeLines = processCodeWithAutoComments(logMessageCodeLines, 'log_message.ts');

    // Добавляем обработанные строки в исходный массив
    codeLines.push(...commentedCodeLines);
}
