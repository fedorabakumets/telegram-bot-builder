import { generateReplaceVariablesFunction, generateInitUserVariablesFunction } from '../utils';

/**
 * Вспомогательная функция для генерации кода, связанного с базой данных
 * @param {boolean} userDatabaseEnabled - Флаг, указывающий, включена ли база данных
 * @param {any[]} nodes - Массив узлов для генерации кода
 * @returns {string} Сгенерированный код для работы с базой данных
 */
export function generateDatabaseCode(userDatabaseEnabled: boolean, nodes: any[]): string {
  let code = '';

  // Добавляем функции для работы с базой данных только если БД включена
  if (userDatabaseEnabled) {
    code += '# Настройки базы данных\n';
    code += 'DATABASE_URL = os.getenv("DATABASE_URL")\n\n';

    code += '# Пул соединений с базой данных\n';
    code += 'db_pool = None\n\n';

    code += '\n# Функции для работы с базой данных\n';
    code += 'async def init_database():\n';
    code += '    """Инициализация подключения к базе данных и создание таблиц"""\n';
    code += '    global db_pool\n';
    code += '    try:\n';
    code += '        db_pool = await asyncpg.create_pool(DATABASE_URL, min_size=1, max_size=10)\n';
    code += '        # Создаем таблицу пользователей если её нет\n';
    code += '        async with db_pool.acquire() as conn:\n';
    code += '            await conn.execute("""\n';
    code += '                CREATE TABLE IF NOT EXISTS bot_users (\n';
    code += '                    user_id BIGINT PRIMARY KEY,\n';
    code += '                    username TEXT,\n';
    code += '                    first_name TEXT,\n';
    code += '                    last_name TEXT,\n';
    code += '                    registered_at TIMESTAMP DEFAULT NOW(),\n';
    code += '                    last_interaction TIMESTAMP DEFAULT NOW(),\n';
    code += '                    interaction_count INTEGER DEFAULT 0,\n';
    code += '                    user_data JSONB DEFAULT \'{}\',\n';
    code += '                    is_active BOOLEAN DEFAULT TRUE\n';
    code += '                );\n';
    code += '            """)\n';
    code += '            # Создаем таблицу сообщений если её нет\n';
    code += '            await conn.execute("""\n';
    code += '                CREATE TABLE IF NOT EXISTS bot_messages (\n';
    code += '                    id SERIAL PRIMARY KEY,\n';
    code += '                    project_id INTEGER,\n';
    code += '                    user_id TEXT NOT NULL,\n';
    code += '                    message_type TEXT NOT NULL,\n';
    code += '                    message_text TEXT,\n';
    code += '                    message_data JSONB,\n';
    code += '                    node_id TEXT,\n';
    code += '                    created_at TIMESTAMP DEFAULT NOW()\n';
    code += '                );\n';
    code += '            """)\n';
    code += '        logging.info("✅ База данных инициализирована")\n';
    code += '    except Exception as e:\n';
    code += '        logging.warning(f"⚠️ Не удалось подключиться к БД: {e}. Используем локальное хранилище.")\n';
    code += '        db_pool = None\n\n';

    // Добавляем функцию для получения московского времени
    code += 'def get_moscow_time():\n';
    code += '    """Возвращает текущее время в московском часовом поясе"""\n';
    code += '    from datetime import datetime, timezone, timedelta\n';
    code += '    moscow_tz = timezone(timedelta(hours=3))\n';
    code += '    return datetime.now(moscow_tz).isoformat()\n\n';

    // Добавляем функцию для инициализации переменных пользователя (рефакторенная версия)
    code += generateReplaceVariablesFunction();

    // Добавляем функцию для инициализации пользовательских переменных
    code += generateInitUserVariablesFunction();

    code += 'async def save_user_to_db(user_id: int, username: Optional[str] = None, first_name: Optional[str] = None, last_name: Optional[str] = None):\n';
    code += '    """Сохраняет пользователя в базу данных"""\n';
    code += '    if not db_pool:\n';
    code += '        return False\n';
    code += '    try:\n';
    code += '        async with db_pool.acquire() as conn:\n';
    code += '            await conn.execute("""\n';
    code += '                INSERT INTO bot_users (user_id, username, first_name, last_name)\n';
    code += '                VALUES ($1, $2, $3, $4)\n';
    code += '                ON CONFLICT (user_id) DO UPDATE SET\n';
    code += '                    username = EXCLUDED.username,\n';
    code += '                    first_name = EXCLUDED.first_name,\n';
    code += '                    last_name = EXCLUDED.last_name,\n';
    code += '                    last_interaction = NOW(),\n';
    code += '                    interaction_count = bot_users.interaction_count + 1\n';
    code += '            """, user_id, username, first_name, last_name)\n';
    code += '        return True\n';
    code += '    except Exception as e:\n';
    code += '        logging.error(f"Ошибка сохранения пользователя в БД: {e}")\n';
    code += '        return False\n\n';

    code += 'async def get_user_from_db(user_id: int):\n';
    code += '    """Получает данные пользователя из базы данных"""\n';
    code += '    if not db_pool:\n';
    code += '        return None\n';
    code += '    try:\n';
    code += '        async with db_pool.acquire() as conn:\n';
    code += '            row = await conn.fetchrow("SELECT * FROM bot_users WHERE user_id = $1", user_id)\n';
    code += '            if row:\n';
    code += '                # Преобразуем Record в словарь\n';
    code += '                row_dict = {key: row[key] for key in row.keys()}\n';
    code += '                # Если есть user_data, возвращаем его содержимое\n';
    code += '                if "user_data" in row_dict and row_dict["user_data"]:\n';
    code += '                    user_data = row_dict["user_data"]\n';
    code += '                    if isinstance(user_data, str):\n';
    code += '                        try:\n';
    code += '                            import json\n';
    code += '                            return json.loads(user_data)\n';
    code += '                        except (json.JSONDecodeError, TypeError):\n';
    code += '                            return {}\n';
    code += '                    elif isinstance(user_data, dict):\n';
    code += '                        return user_data\n';
    code += '                    else:\n';
    code += '                        return {}\n';
    code += '                # Если нет user_data, возвращаем полную запись\n';
    code += '                return row_dict\n';
    code += '        return None\n';
    code += '    except Exception as e:\n';
    code += '        logging.error(f"Ошибка получения пользователя из БД: {e}")\n';
    code += '        return None\n\n';

    code += 'async def get_user_data_from_db(user_id: int, data_key: str):\n';
    code += '    """Получает конкретное значение из поля user_data пользователя"""\n';
    code += '    if not db_pool:\n';
    code += '        return None\n';
    code += '    try:\n';
    code += '        async with db_pool.acquire() as conn:\n';
    code += '            # Используем оператор ->> для получения значения поля JSONB как текста\n';
    code += '            value = await conn.fetchval(\n';
    code += '                "SELECT user_data ->> $2 FROM bot_users WHERE user_id = $1",\n';
    code += '                user_id,\n';
    code += '                data_key\n';
    code += '            )\n';
    code += '            return value\n';
    code += '    except Exception as e:\n';
    code += '        logging.error(f"Ошибка получения данных пользователя из БД: {e}")\n';
    code += '        return None\n\n';

    // Добавляем функции handle_command_ как алиасы для handlers
    code += '# Алиас функции для callback обработчиков\n';
    code += 'async def handle_command_start(message):\n';
    code += '    """Алиас для start_handler, используется в callback обработчиках"""\n';
    code += '    await start_handler(message)\n\n';

    // Добавляем алиасы для всех команд
    const commandAliasNodes = (nodes || []).filter(node => node.type === 'command' && node.data.command);
    commandAliasNodes.forEach(node => {
      const command = node.data.command.replace('/', '');
      const functionName = command.replace(/[^a-zA-Z0-9_]/g, '_');
      code += `async def handle_command_${functionName}(message):\n`;
      code += `    """Алиас для ${functionName}_handler, используется в callback обработчиках"""\n`;
      code += `    await ${functionName}_handler(message)\n\n`;
    });

    code += 'async def update_user_data_in_db(user_id: int, data_key: str, data_value):\n';
    code += '    """Обновляет пользовательские данные в базе данных"""\n';
    code += '    if not db_pool:\n';
    code += '        return False\n';
    code += '    try:\n';
    code += '        import json\n';
    code += '        async with db_pool.acquire() as conn:\n';
    code += '            # Сначала создаём или получаем существующую запись\n';
    code += '            await conn.execute("""\n';
    code += '                INSERT INTO bot_users (user_id) \n';
    code += '                VALUES ($1) \n';
    code += '                ON CONFLICT (user_id) DO NOTHING\n';
    code += '            """, user_id)\n';
    code += '            \n';
    code += '            # Обновляем данные пользователя\n';
    code += '            update_data = {data_key: data_value}\n';
    code += '            await conn.execute("""\n';
    code += '                UPDATE bot_users \n';
    code += '                SET user_data = COALESCE(user_data, \'{}\'::jsonb) || $2::jsonb,\n';
    code += '                    last_interaction = NOW()\n';
    code += '                WHERE user_id = $1\n';
    code += '            """, user_id, json.dumps(update_data))\n';
    code += '        return True\n';
    code += '    except Exception as e:\n';
    code += '        logging.error(f"Ошибка обновления данных пользователя: {e}")\n';
    code += '        return False\n\n';

    // Добавляем алиас функции для обратной совместимости
    code += 'async def save_user_data_to_db(user_id: int, data_key: str, data_value):\n';
    code += '    """Алиас для update_user_data_in_db для обратной совместимости"""\n';
    code += '    return await update_user_data_in_db(user_id, data_key, data_value)\n\n';

    code += 'async def update_user_variable_in_db(user_id: int, variable_name: str, variable_value: str):\n';
    code += '    """Сохраняет переменную пользователя в базу данных"""\n';
    code += '    if not db_pool:\n';
    code += '        return False\n';
    code += '    try:\n';
    code += '        import json\n';
    code += '        async with db_pool.acquire() as conn:\n';
    code += '            # Сначала создаём или получаем существующую запись\n';
    code += '            await conn.execute("""\n';
    code += '                INSERT INTO bot_users (user_id) \n';
    code += '                VALUES ($1) \n';
    code += '                ON CONFLICT (user_id) DO NOTHING\n';
    code += '            """, user_id)\n';
    code += '            \n';
    code += '            # Обновляем переменную пользователя\n';
    code += '            update_data = {variable_name: variable_value}\n';
    code += '            await conn.execute("""\n';
    code += '                UPDATE bot_users \n';
    code += '                SET user_data = COALESCE(user_data, \'{}\'::jsonb) || $2::jsonb,\n';
    code += '                    last_interaction = NOW()\n';
    code += '                WHERE user_id = $1\n';
    code += '            """, user_id, json.dumps(update_data))\n';
    code += '        return True\n';
    code += '    except Exception as e:\n';
    code += '        logging.error(f"Ошибка сохранения переменной пользователя: {e}")\n';
    code += '        return False\n\n';

    code += 'async def log_message(user_id: int, message_type: str, message_text: str = None, message_data: dict = None, node_id: str = None):\n';
    code += '    """Логирует сообщение в базу данных"""\n';
    code += '    if not db_pool:\n';
    code += '        return False\n';
    code += '    try:\n';
    code += '        import json\n';
    code += '        async with db_pool.acquire() as conn:\n';
    code += '            await conn.execute("""\n';
    code += '                INSERT INTO bot_messages (user_id, message_type, message_text, message_data, node_id)\n';
    code += '                VALUES ($1, $2, $3, $4, $5)\n';
    code += '            """, str(user_id), message_type, message_text, json.dumps(message_data) if message_data else None, node_id)\n';
    code += '        return True\n';
    code += '    except Exception as e:\n';
    code += '        logging.error(f"Ошибка логирования сообщения: {e}")\n';
    code += '        return False\n\n';
  }

  return code;
}
