# Шаблон: middleware.py.jinja2

## Описание

Генерирует Python middleware для Telegram бота. Включает:
- `register_user_middleware` — автоматическая инициализация `user_data` при первом обращении пользователя
- `message_logging_middleware` — логирование входящих сообщений (только при БД)
- `callback_query_logging_middleware` — логирование нажатий кнопок (только при БД + inline кнопки)

## Параметры

| Параметр | Тип | По умолчанию | Описание |
|----------|-----|--------------|----------|
| `userDatabaseEnabled` | `boolean` | `false` | Включить логирование через БД |
| `autoRegisterUsers` | `boolean` | `false` | Генерировать `register_user_middleware` |

## Использование

```typescript
import { generateMessageLoggingCode } from './middleware.renderer';

// Без БД — только авторегистрация
const code = generateMessageLoggingCode(false, false, null, true);

// С БД — авторегистрация + логирование
const code = generateMessageLoggingCode(true, true, projectId, true);
```

## Поведение register_user_middleware

При первом обращении любого пользователя (через любой триггер, команду или кнопку):
1. Проверяет `user_id not in user_data`
2. Инициализирует `user_data[user_id]` с `username`, `first_name`, `last_name`
3. Если `userDatabaseEnabled` — вызывает `save_user_to_db()`
4. Логирует событие

Регистрируется в `main()` через `dp.message.middleware(register_user_middleware)` — всегда, независимо от БД.

## Примеры вывода

### autoRegisterUsers=true, userDatabaseEnabled=false

```python
async def register_user_middleware(handler, event: types.Message, data: dict):
    """Автоматически инициализирует user_data при первом обращении пользователя"""
    try:
        user = event.from_user
        if user:
            user_id = user.id
            if user_id not in user_data:
                user_data[user_id] = {
                    'username': user.username or '',
                    'first_name': user.first_name or '',
                    'last_name': user.last_name or '',
                }
                logging.info(f"Новый пользователь зарегистрирован: {user_id}")
    except Exception as e:
        logging.error(f"Ошибка в register_user_middleware: {e}")

    return await handler(event, data)
```

### autoRegisterUsers=true, userDatabaseEnabled=true

Дополнительно вызывает `save_user_to_db()` при регистрации.

## Регистрация в main()

```python
# Всегда (если autoRegisterUsers=true)
dp.message.middleware(register_user_middleware)

# Только при userDatabaseEnabled=true
dp.message.middleware(message_logging_middleware)
dp.message.outer_middleware(BotOutgoingLoggingMiddleware())

# Только при userDatabaseEnabled=true + hasInlineButtons=true
dp.callback_query.middleware(callback_query_logging_middleware)
```

## Тесты

```bash
npx vitest run --config vitest.lib.config.ts lib/templates/middleware
```

## Файлы

```
middleware/
├── middleware.py.jinja2    # Шаблон
├── middleware.params.ts    # Типы параметров
├── middleware.schema.ts    # Zod схема
├── middleware.renderer.ts  # Функции генерации
├── middleware.fixture.ts   # Тестовые данные
├── middleware.test.ts      # Тесты (vitest)
├── middleware.md           # Документация
└── index.ts                # Публичный экспорт
```

## См. также

- [`main.py.jinja2`](../main/) — регистрация middleware в `dp`
- [`utils.py.jinja2`](../utils/) — `check_auth`, `is_admin`, `save_user_to_db`
