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
| `saveIncomingMedia` | `boolean` | `false` | Скачивать и сохранять входящие фото в БД |

## Использование

```typescript
import { generateMessageLoggingCode } from './middleware.renderer';

// Без БД — только авторегистрация
const code = generateMessageLoggingCode(false, false, null, true);

// С БД — авторегистрация + логирование
const code = generateMessageLoggingCode(true, true, projectId, true);

// С БД + сохранение входящих фото
const code = generateMessageLoggingCode(true, false, projectId, true, true);
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


## Интеграция с Redis Pub/Sub (живой диалог)

При `userDatabaseEnabled=true` функция `save_message_to_api` после успешного сохранения в PostgreSQL публикует событие в Redis канал `bot:message:{PROJECT_ID}:{TOKEN_ID}`.

### Payload события

```json
{
  "userId": "123456789",
  "messageType": "user",
  "messageText": "Привет!",
  "messageData": { "message_id": 456 },
  "nodeId": null,
  "id": 789,
  "createdAt": "2026-05-03T14:30:00.000000"
}
```

### Поведение

- Публикация выполняется **после** успешного INSERT — данные гарантированно в БД
- Если Redis недоступен — ошибка логируется на уровне DEBUG, сохранение в БД не прерывается
- Node.js сервер подписан на паттерн `bot:message:*` через `redisPlatformSubscriber`
- При получении события сервер рассылает его через WebSocket всем подключённым клиентам
- `DialogPanel` в UI получает событие и мгновенно добавляет сообщение без HTTP refetch

### Канал Redis

Формат: `bot:message:{PROJECT_ID}:{TOKEN_ID}`

Пример: `bot:message:1:2` — проект 1, токен 2.

## Сохранение входящих фото (saveIncomingMedia)

При `saveIncomingMedia=true` в `message_logging_middleware` добавляется вызов:

```python
if photo_file_id:
    asyncio.create_task(_save_incoming_photo_to_db(photo_file_id, message_data.get("photo", {})))
```

Функция `_save_incoming_photo_to_db` (из `save-message-to-api.py.jinja2`):
1. Получает `file_path` через Telegram API (`getFile`)
2. Скачивает файл через `aiohttp`
3. Сохраняет на диск в `uploads/{PROJECT_ID}/{date}/photo_{file_id}.jpg`
4. Ждёт появления записи сообщения в `bot_messages` (до 3 сек, 6 попыток × 0.5с)
5. Вставляет запись в `media_files`
6. Связывает через `bot_message_media` и обновляет `primary_media_id` в `bot_messages`

### Переменная окружения

```env
SAVE_INCOMING_MEDIA=true
```

Читается в боте как:
```python
os.getenv("SAVE_INCOMING_MEDIA", "false").lower() == "true"
```

### Зависимости

- `aiohttp` — уже присутствует в `requirements.txt`
- `asyncpg` — используется через `db_pool`
- Таблицы: `media_files`, `bot_message_media`, `bot_messages`

### Поведение при ошибках

Все ошибки логируются на уровне `DEBUG` — функция fire-and-forget, не прерывает обработку сообщений.
