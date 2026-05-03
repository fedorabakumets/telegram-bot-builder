# Шаблон: database.py.jinja2

## Описание

Генерирует Python функции для работы с базой данных пользователей: инициализация, сохранение, получение, обновление.

## Параметры

| Параметр | Тип | По умолчанию | Описание |
|----------|-----|--------------|----------|
| `userDatabaseEnabled` | `boolean` | `false` | Включена ли база данных пользователей |
| `hasMessageLogging` | `boolean` | `false` | Генерировать функцию `log_message` |
| `hasUserIdsTable` | `boolean` | `false` | Генерировать функцию `get_user_ids_from_db` |
| `hasTelegramSettingsTable` | `boolean` | `false` | Создавать таблицу `user_telegram_settings` |
| `hasUserDataAccess` | `boolean` | `false` | Генерировать функции чтения/записи переменных |

## Использование

### Базовое

```typescript
import { generateDatabase } from './database.renderer';

const code = generateDatabase({
  userDatabaseEnabled: true,
});
```

### С валидацией

```typescript
import { generateDatabase, databaseParamsSchema } from './database.renderer';

try {
  const validated = databaseParamsSchema.parse(params);
  const code = generateDatabase(validated);
} catch (error) {
  console.error('Невалидные параметры:', error);
}
```

## Примеры вывода

### База данных включена

**Вход:**
```typescript
{
  userDatabaseEnabled: true
}
```

**Выход:**
```python
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
            # ... обработка результата
        return None
    except Exception as e:
        logging.error(f"Ошибка получения пользователя из БД: {e}")
        return None


async def update_user_data_in_db(user_id: int, data_key: str, data_value):
    """Обновляет пользовательские данные в базе данных"""
    if not db_pool:
        return False
    # ... реализация обновления
```

### База данных выключена

**Вход:**
```typescript
{
  userDatabaseEnabled: false
}
```

**Выход:**
```
(пустая строка)
```

## Логика условий

### Все функции БД
```typescript
if (userDatabaseEnabled === true) {
  // Сгенерировать все 4 функции
} else {
  // Вернуть пустую строку
}
```

## Тесты

### Запуск тестов

```bash
npm test -- database.test.ts
```

### Покрытие тестов

- ✅ Валидные данные (БД включена/выключена)
- ✅ Невалидные данные (неправильные типы)
- ✅ Значения по умолчанию
- ✅ Граничные случаи (все 4 функции)
- ✅ Производительность (< 10ms на генерацию)
- ✅ Структура Zod схемы

## Зависимости

### Внешние
- `zod` — валидация параметров
- `nunjucks` — рендеринг шаблона

### Внутренние
- `../template-renderer` — функция рендеринга
- `./database.params` — типы параметров
- `./database.schema` — Zod схема
- `./database.fixture` — тестовые данные

## Файлы

```
database/
├── database.py.jinja2      # Шаблон (100 строк)
├── database.params.ts      # Типы (12 строк)
├── database.schema.ts      # Zod схема (14 строк)
├── database.renderer.ts    # Функция рендеринга (26 строк)
├── database.fixture.ts     # Тестовые данные (100 строк)
├── database.test.ts        # Тесты (200 строк)
├── database.md             # Документация (этот файл)
└── index.ts                # Публичный экспорт
```

## См. также

- [`config.py.jinja2`](../config/config.md) — шаблон конфигурации
- [`utils.py.jinja2`](../utils/utils.md) — шаблон утилит
- [`main.py.jinja2`](../main/main.md) — шаблон запуска

## Интеграция с Redis

Функция `init_database()` инициализирует только PostgreSQL пул. Redis инициализируется отдельно через `init_redis_client()` из `config.py.jinja2`, которая вызывается в `main()` перед стартом бота.

После инициализации Redis клиент доступен через глобальную переменную `_redis_client`. Функция `save_message_to_api` использует его для публикации событий в канал `bot:message:{PROJECT_ID}:{TOKEN_ID}`.
