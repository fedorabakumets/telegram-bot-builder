/**
 * @fileoverview Тестовые данные для шаблона базы данных
 * @module templates/database/database.fixture
 */

import type { DatabaseTemplateParams } from './database.params';

/** Валидные параметры: БД включена */
export const validParamsEnabled: DatabaseTemplateParams = {
  userDatabaseEnabled: true,
};

/** Валидные параметры: БД выключена */
export const validParamsDisabled: DatabaseTemplateParams = {
  userDatabaseEnabled: false,
};

/** Невалидные параметры: неправильный тип */
export const invalidParamsWrongType = {
  userDatabaseEnabled: 'true', // должно быть boolean
};

/** Невалидные параметры: отсутствует поле */
export const invalidParamsMissingField = {
  // отсутствует userDatabaseEnabled
};

/** Ожидаемый вывод: БД включена */
export const expectedOutputEnabled = `
async def init_database():
    """Инициализация подключения к базе данных и создание таблиц"""
    global db_pool
    try:
        db_pool = await asyncpg.create_pool(DATABASE_URL, min_size=1, max_size=10)
        async with db_pool.acquire() as conn:
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS bot_users (
                    user_id BIGINT PRIMARY KEY,
                    username TEXT,
                    first_name TEXT,
                    last_name TEXT,
                    registered_at TIMESTAMP DEFAULT NOW(),
                    last_interaction TIMESTAMP DEFAULT NOW(),
                    interaction_count INTEGER DEFAULT 0,
                    user_data JSONB DEFAULT '{}',
                    is_active BOOLEAN DEFAULT TRUE
                );
            """)
        logging.info("✅ База данных инициализирована")
    except Exception as e:
        logging.warning(f"⚠️ Не удалось подключиться к БД: {e}. Используем локальное хранилище.")
        db_pool = None


async def save_user_to_db(user_id: int, username: str = None, first_name: str = None, last_name: str = None):
    """Сохраняет пользователя в базу данных"""
    if not db_pool:
        return False
    try:
        async with db_pool.acquire() as conn:
            await conn.execute("""
                INSERT INTO bot_users (user_id, username, first_name, last_name)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (user_id) DO UPDATE SET
                    username = EXCLUDED.username,
                    first_name = EXCLUDED.first_name,
                    last_name = EXCLUDED.last_name,
                    last_interaction = NOW(),
                    interaction_count = bot_users.interaction_count + 1
            """, user_id, username, first_name, last_name)
        return True
    except Exception as e:
        logging.error(f"Ошибка сохранения пользователя в БД: {e}")
        return False


async def get_user_from_db(user_id: int):
    """Получает данные пользователя из базы данных"""
    if not db_pool:
        return None
    try:
        async with db_pool.acquire() as conn:
            row = await conn.fetchrow("SELECT * FROM bot_users WHERE user_id = $1", user_id)
            if row:
                row_dict = {key: row[key] for key in row.keys()}
                if "user_data" in row_dict and row_dict["user_data"]:
                    user_data = row_dict["user_data"]
                    if isinstance(user_data, str):
                        try:
                            return json.loads(user_data)
                        except (json.JSONDecodeError, TypeError):
                            return {}
                    elif isinstance(user_data, dict):
                        return user_data
                return row_dict
        return None
    except Exception as e:
        logging.error(f"Ошибка получения пользователя из БД: {e}")
        return None


def _is_temporary_user_data_connection_error(error):
    """Определяет временный обрыв соединения, исключая ошибки данных и SQL."""
    if isinstance(error, (ConnectionError, asyncio.TimeoutError, asyncpg.PostgresConnectionError)):
        return True
    sqlstate = getattr(error, "sqlstate", None)
    if sqlstate and (sqlstate.startswith("08") or sqlstate in ("57P01", "57P02", "57P03")):
        return True
    # Закрытый объект соединения отличается от ошибок конкурентного использования.
    return isinstance(error, asyncpg.InterfaceError) and "connection is closed" in str(error).lower()


async def update_user_data_in_db(user_id: int, data_key: str, data_value):
    """Атомарно сохраняет поле пользователя с тремя попытками при обрыве связи."""
    if not db_pool:
        logging.error("Операция update_user_data_in_db: пул БД недоступен; попытка 0/3")
        return False
    for attempt in range(1, 4):
        try:
            # Новый acquire позволяет пулу заменить разорванное соединение.
            async with db_pool.acquire() as conn:
                await conn.execute("""
                    INSERT INTO bot_users (user_id, project_id, token_id, user_data, last_interaction)
                    VALUES ($1, $2, $3, $4::jsonb, NOW())
                    ON CONFLICT (user_id, project_id, token_id) DO UPDATE SET
                        user_data = COALESCE(bot_users.user_data, '{}'::jsonb) || EXCLUDED.user_data,
                        last_interaction = NOW()
                """, user_id, PROJECT_ID, TOKEN_ID, json.dumps({data_key: data_value}, ensure_ascii=False))
            if attempt > 1:
                logging.warning("Операция update_user_data_in_db: запись восстановлена; попытка %s/3", attempt)
            return True
        except Exception as error:
            error_type = type(error).__name__
            if attempt == 3 or not _is_temporary_user_data_connection_error(error):
                logging.error(
                    "Операция update_user_data_in_db: запись не выполнена; тип %s; попытка %s/3",
                    error_type, attempt,
                )
                return False
            logging.warning(
                "Операция update_user_data_in_db: временный сбой соединения, повтор; тип %s; попытка %s/3",
                error_type, attempt,
            )
            await asyncio.sleep(0.5 * attempt)
`.trim();

/** Ожидаемый вывод: БД выключена (пустой) */
export const expectedOutputDisabled = '';
