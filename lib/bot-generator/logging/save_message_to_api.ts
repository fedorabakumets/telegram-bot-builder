/**
 * @fileoverview Утилита для генерации кода функции сохранения сообщений в базу данных
 *
 * Этот модуль предоставляет функцию для генерации Python-кода,
 * реализующего асинхронное сохранение сообщений в базу данных
 * напрямую через asyncpg, без HTTP API.
 *
 * @module save_message_to_api
 */

import { processCodeWithAutoComments } from '../utils/generateGeneratedComment';

/**
 * Добавляет в код асинхронную функцию для сохранения сообщений в базу данных напрямую
 * @param {string[]} codeLines - Массив строк кода, в который будет добавлена функция
 * @param {_projectId} ID проекта для сохранения в базу данных
 */
export function save_message_to_api(codeLines: string[], _projectId: number | null) {
    const dbFunctionCodeLines: string[] = [];

    dbFunctionCodeLines.push('# Функция для сохранения сообщений в базу данных напрямую (без API)');
    dbFunctionCodeLines.push('async def save_message_to_api(user_id: str, message_type: str, message_text: str = None, node_id: str = None, message_data: dict = None):');
    dbFunctionCodeLines.push('    """Сохраняет сообщение в базу данных напрямую через asyncpg"""');
    dbFunctionCodeLines.push('    try:');
    dbFunctionCodeLines.push('        # Получаем соединение из пула');
    dbFunctionCodeLines.push('        async with db_pool.acquire() as conn:');
    dbFunctionCodeLines.push('            # Формируем данные для сохранения');
    dbFunctionCodeLines.push('            message_data_json = json.dumps(message_data or {}, ensure_ascii=False)');
    dbFunctionCodeLines.push('            ');
    dbFunctionCodeLines.push('            # Вставляем сообщение в базу данных');
    dbFunctionCodeLines.push('            result = await conn.fetchrow(');
    dbFunctionCodeLines.push('                """');
    dbFunctionCodeLines.push('                INSERT INTO bot_messages (project_id, user_id, message_type, message_text, node_id, message_data, created_at)');
    dbFunctionCodeLines.push('                VALUES ($1, $2, $3, $4, $5, $6, NOW())');
    dbFunctionCodeLines.push('                RETURNING id, user_id, message_type, created_at');
    dbFunctionCodeLines.push('                """,');
    dbFunctionCodeLines.push('                PROJECT_ID,');
    dbFunctionCodeLines.push('                str(user_id),');
    dbFunctionCodeLines.push('                message_type,');
    dbFunctionCodeLines.push('                message_text,');
    dbFunctionCodeLines.push('                node_id,');
    dbFunctionCodeLines.push('                message_data_json');
    dbFunctionCodeLines.push('            )');
    dbFunctionCodeLines.push('            ');
    dbFunctionCodeLines.push('            logging.info(f"✅ Сообщение сохранено в БД: {message_type} от {user_id} (id={result[\'id\']})")');
    dbFunctionCodeLines.push('            return {"id": result[\'id\'], "user_id": result[\'user_id\'], "message_type": result[\'message_type\'], "created_at": result[\'created_at\']}');
    dbFunctionCodeLines.push('    except Exception as e:');
    dbFunctionCodeLines.push('        logging.error(f"❌ Ошибка сохранения сообщения в БД: {e}")');
    dbFunctionCodeLines.push('    return None');
    dbFunctionCodeLines.push('');

    // Применяем автоматическое добавление комментариев ко всему коду
    const commentedCodeLines = processCodeWithAutoComments(dbFunctionCodeLines, 'save_message_to_api.ts');

    // Добавляем обработанные строки в исходный массив
    codeLines.push(...commentedCodeLines);
}
