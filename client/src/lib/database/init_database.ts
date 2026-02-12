/**
 * @fileoverview Утилита для инициализации подключения к базе данных
 *
 * Этот модуль предоставляет функции для генерации Python-кода,
 * обеспечивающего инициализацию подключения к базе данных и создание
 * необходимых таблиц, если они не существуют.
 *
 * @module init_database
 */

import { processCodeWithAutoComments } from '../utils/generateGeneratedComment';

/**
 * Генерирует код для инициализации подключения к базе данных и создания таблиц
 * @param {string[]} codeLines - Массив строк для добавления сгенерированного кода
 */
export function init_database(codeLines: string[]) {
    const initDbCodeLines: string[] = [];

    // Инициализация базы данных
    codeLines.push('# ┌─────────────────────────────────────────┐');
    codeLines.push('# │      Инициализация базы данных          │');
    codeLines.push('# └─────────────────────────────────────────┘');
    
    initDbCodeLines.push('async def init_database():');
    initDbCodeLines.push('    """Инициализация подключения к базе данных и создание таблиц"""');
    initDbCodeLines.push('    global db_pool');
    initDbCodeLines.push('    try:');
    initDbCodeLines.push('        db_pool = await asyncpg.create_pool(DATABASE_URL, min_size=1, max_size=10)');
    initDbCodeLines.push('        # Создаем таблицу пользователей если её нет');
    initDbCodeLines.push('        async with db_pool.acquire() as conn:');
    initDbCodeLines.push('            await conn.execute("""');
    initDbCodeLines.push('                CREATE TABLE IF NOT EXISTS bot_users (');
    initDbCodeLines.push('                    user_id BIGINT PRIMARY KEY,');
    initDbCodeLines.push('                    username TEXT,');
    initDbCodeLines.push('                    first_name TEXT,');
    initDbCodeLines.push('                    last_name TEXT,');
    initDbCodeLines.push('                    registered_at TIMESTAMP DEFAULT NOW(),');
    initDbCodeLines.push('                    last_interaction TIMESTAMP DEFAULT NOW(),');
    initDbCodeLines.push('                    interaction_count INTEGER DEFAULT 0,');
    initDbCodeLines.push('                    user_data JSONB DEFAULT \'{}\',');
    initDbCodeLines.push('                    is_active BOOLEAN DEFAULT TRUE');
    initDbCodeLines.push('                );');
    initDbCodeLines.push('            """)');
    initDbCodeLines.push('            # Создаем таблицу сообщений если её нет');
    initDbCodeLines.push('            await conn.execute("""');
    initDbCodeLines.push('                CREATE TABLE IF NOT EXISTS bot_messages (');
    initDbCodeLines.push('                    id SERIAL PRIMARY KEY,');
    initDbCodeLines.push('                    project_id INTEGER,');
    initDbCodeLines.push('                    user_id TEXT NOT NULL,');
    initDbCodeLines.push('                    message_type TEXT NOT NULL,');
    initDbCodeLines.push('                    message_text TEXT,');
    initDbCodeLines.push('                    message_data JSONB,');
    initDbCodeLines.push('                    node_id TEXT,');
    initDbCodeLines.push('                    created_at TIMESTAMP DEFAULT NOW()');
    initDbCodeLines.push('                );');
    initDbCodeLines.push('            """)');
    initDbCodeLines.push('        logging.info("✅ База данных инициализирована")');
    initDbCodeLines.push('    except Exception as e:');
    initDbCodeLines.push('        logging.warning(f"⚠️ Не удалось подключиться к БД: {e}. Используем локальное хранилище.")');
    initDbCodeLines.push('        db_pool = None');

    // Применяем автоматическое добавление комментариев ко всему коду
    const commentedCodeLines = processCodeWithAutoComments(initDbCodeLines, 'init_database.ts');

    // Добавляем обработанные строки в исходный массив
    codeLines.push(...commentedCodeLines);
}
