# Системный API бота (скрытые эндпоинты)

Документ описывает архитектуру внутреннего HTTP API генерируемого бота.
Эндпоинты **не отображаются на холсте** — генерируются автоматически, используются Node.js для управления ботом.

---

## Концепция

Два уровня HTTP-эндпоинтов в боте:

| Уровень | Видимость | Кто создаёт | Пример |
|---|---|---|---|
| **Системные** | Скрытые (не на холсте) | Генератор автоматически | `/api/send-message`, `/api/broadcast` |
| **Пользовательские** | Нода `webhook_trigger` на холсте | Пользователь | `/payment`, `/notify` |

Системные эндпоинты — как middleware сейчас: пользователь не видит `message_logging_middleware` на холсте, но оно работает. Так же и API — не видно, но Node.js использует.

---

## Архитектура

### Текущая схема (без API бота)

```
UI → Node.js → Telegram API напрямую
                ↓
              PostgreSQL (запись сообщения)
                ↓
              WebSocket (уведомление UI)
```

Проблемы:
- Node.js дублирует логику бота (переменные, file_id кеш)
- Бот не знает о рассылке (не обновляет user_data, не выполняет автопереходы)
- Два источника правды

### Целевая схема (с API бота)

```
UI → Node.js → POST bot:PORT/api/broadcast
                        ↓
                  Бот выполняет рассылку:
                    → подставляет переменные из user_data
                    → отправляет через bot.send_message()
                    → middleware логирует в БД
                    → Redis publish → Node.js → WebSocket → UI
```

Один источник правды — бот.

---

## HTTP-сервер в боте

### Webhook режим
Уже есть `aiohttp` app — добавляем роуты к существующему серверу.

### Polling режим
Поднимаем отдельный `aiohttp` сервер параллельно polling:

```python
async def main():
    # ... инициализация ...
    
    api_task = asyncio.create_task(start_system_api_server())
    polling_task = asyncio.create_task(dp.start_polling(bot))
    
    await _stop_event.wait()
```

Порт: env `BOT_API_PORT` (по умолчанию 8081).

---

## Эндпоинты

### Авторизация

Все запросы проверяют заголовок:
```
X-Bot-Secret: {secret_token}
```

Токен генерируется при создании проекта, хранится в:
- env бота (`BOT_API_SECRET`)
- БД Node.js (`bot_tokens.api_secret` или `bot_projects.settings`)

---

### `GET /api/status`

Проверка доступности бота.

**Ответ:**
```json
{
  "ok": true,
  "uptime": 3600,
  "usersInMemory": 150,
  "mode": "polling"
}
```

---

### `POST /api/send-message`

Отправить сообщение конкретному пользователю через бота.

**Запрос:**
```json
{
  "userId": "123456789",
  "text": "Привет, {first_name}! Баланс: {balance}",
  "media": ["/uploads/photo.jpg"],
  "meta": {
    "sentFromBroadcast": true,
    "broadcastId": 42
  }
}
```

**Что делает бот:**
1. Подставляет переменные из `user_data[userId]`
2. Отправляет через `bot.send_message()` / `bot.send_photo()`
3. Middleware логирует в БД с `messageData = meta`
4. Redis publish `bot:message` → Node.js → WebSocket → UI
5. Возвращает `{ ok: true, messageId: 12345 }`

**Поле `meta`** — произвольные метаданные, сохраняются в `messageData` при логировании. Позволяет UI определить источник сообщения (рассылка, ручная отправка, автоматизация).

---

### `POST /api/broadcast`

Рассылка по списку пользователей через бота.

**Запрос:**
```json
{
  "userIds": ["123", "456", "789"],
  "text": "Акция! {first_name}, скидка 50%",
  "media": ["/uploads/banner.jpg"],
  "meta": {
    "sentFromBroadcast": true,
    "broadcastId": 42
  },
  "throttle": 25
}
```

**Что делает бот:**
1. Для каждого userId — подставляет переменные, отправляет, логирует
2. Throttle 25 msg/sec (настраиваемо)
3. Обрабатывает ошибки (403 blocked, 429 rate limit)
4. Возвращает `{ ok: true, sent: 780, failed: 20, blocked: 15 }`

**Преимущества перед текущим broadcastQueue в Node.js:**
- Переменные из актуального `user_data` бота (не из PostgreSQL с задержкой)
- file_id кеш в памяти бота (быстрее чем запрос в БД)
- Middleware автоматически логирует и публикует события

---

### `POST /api/execute-node`

Выполнить конкретную ноду сценария для пользователя.

**Запрос:**
```json
{
  "nodeId": "node-abc-123",
  "userId": "123456789"
}
```

**Что делает бот:**
1. Находит handler ноды (`handle_callback_node_abc_123`)
2. Создаёт fake CallbackQuery для userId
3. Выполняет handler — бот отправляет сообщение, выполняет автопереходы
4. Возвращает `{ ok: true }`

**Use-case:** Запуск цепочки нод извне — от платёжной системы, cron, интеграции.

---

### `POST /api/send-to-group`

Отправить сообщение в группу.

**Запрос:**
```json
{
  "groupId": "-1001234567890",
  "text": "Новый курс: 82.5 RUB/USDT",
  "media": [],
  "meta": { "sentFromBroadcast": true, "broadcastId": 42 }
}
```

---

### `GET /api/user/:userId`

Получить данные пользователя из памяти бота.

**Ответ:**
```json
{
  "userId": "123456789",
  "state": "node-abc-123",
  "variables": {
    "first_name": "Вася",
    "balance": "500",
    "last_rate": "82.5"
  }
}
```

---

### `POST /api/user/:userId/set-variable`

Установить переменную пользователя.

**Запрос:**
```json
{
  "key": "balance",
  "value": "1000"
}
```

---

## Интеграция с Node.js

### Discovery — как Node.js узнаёт URL бота

Варианты (в порядке приоритета):
1. **Redis** — бот при старте публикует `bot:started:{projectId}:{tokenId}` с `apiUrl`
2. **БД** — бот при старте записывает `api_url` в `bot_instances`
3. **Env** — захардкожен в настройках проекта

### Fallback

Если бот недоступен (упал, не запущен) — Node.js использует текущий механизм (Telegram API напрямую). Graceful degradation.

```ts
async function sendMessage(projectId, userId, text, meta) {
  const botUrl = await getBotApiUrl(projectId);
  
  if (botUrl) {
    // Через бота — полная логика
    return fetch(`${botUrl}/api/send-message`, { ... });
  }
  
  // Fallback — напрямую через Telegram API
  return sendTelegramMessage(token, userId, text, ...);
}
```

---

## Реализация в генераторе

Новый шаблон: `lib/templates/system-api/system-api.py.jinja2`

Генерируется всегда (если включена БД пользователей). Добавляется в `main()`:

```python
# В webhook режиме — роуты добавляются к существующему app
app.router.add_get("/api/status", handle_system_status)
app.router.add_post("/api/send-message", handle_system_send_message)
app.router.add_post("/api/broadcast", handle_system_broadcast)
app.router.add_post("/api/execute-node", handle_system_execute_node)

# В polling режиме — отдельный сервер
asyncio.create_task(start_system_api(port=BOT_API_PORT))
```

---

## Порядок реализации

1. **`GET /api/status`** — простейший, проверка что инфраструктура работает
2. **`POST /api/send-message`** — основной, заменяет прямую отправку из Node.js
3. **`POST /api/broadcast`** — заменяет `broadcastQueue` в Node.js
4. **`POST /api/execute-node`** — разблокирует интеграции
5. **Остальные** — по мере необходимости

---

## Связь с `webhook_trigger` (нода на холсте)

`webhook_trigger` — это **пользовательские** эндпоинты. Пользователь сам создаёт путь, выбирает переменные, строит цепочку.

Системные эндпоинты и `webhook_trigger` используют **один HTTP-сервер** (один порт). Разница:
- Системные: путь начинается с `/api/...`, авторизация по secret
- Пользовательские: путь задаётся пользователем (`/payment`, `/notify`), авторизация по `secretToken` ноды

```python
# Один aiohttp app, два типа роутов:
app.router.add_post("/api/send-message", handle_system_send_message)  # системный
app.router.add_post("/payment", handle_webhook_node_abc)              # пользовательский
```
