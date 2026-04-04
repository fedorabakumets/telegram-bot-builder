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
2. Инициализирует `user_data[user_id]` с `username`, `first_name`, `last_name`, `user_name`, `user_id`, `language_code`, `is_premium`, `is_bot`
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
                    'user_name': user.username or user.first_name or str(user_id),
                    'user_id': user_id,
                    'language_code': user.language_code or '',
                    'is_premium': user.is_premium or False,
                    'is_bot': user.is_bot or False,
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

## Интеграция с outgoing_message_trigger

Все методы отправки сообщений вызывают обработчики из `_outgoing_message_trigger_handlers` после отправки. Это позволяет узлу `outgoing_message_trigger` перехватывать любые исходящие сообщения бота — текст, фото, видео, аудио, документы.

Перехватываемые методы:
- `bot.send_message` → через `_wrap_bot_send_message`
- `bot.send_photo` → через `_wrap_bot_send_photo`
- `bot.send_sticker` → через `_wrap_bot_send_sticker` (текст: `[Стикер]`)
- `bot.send_voice` → через `_wrap_bot_send_voice` (текст: caption или `[Голосовое]`)
- `bot.send_animation` → через `_wrap_bot_send_animation` (текст: caption или `[Анимация]`)
- `bot.send_media_group` → через `_wrap_bot_send_media_group` (текст: `[Медиагруппа]`, message_id первого сообщения)
- `message.answer` → через `_patched_answer`
- `message.answer_photo` → через `_patched_answer_photo`
- `message.answer_video` → через `_patched_answer_video`
- `message.answer_audio` → через `_patched_answer_audio`
- `message.answer_document` → через `_patched_answer_document`

Каждый обработчик получает: `user_id`, `message_id` (для `forward_message`), `text/caption`, `chat_id`.
