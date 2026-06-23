# Redis Events — Улучшения

## Текущее состояние

| Канал | Когда | Данные |
|-------|-------|--------|
| `bot:message:{pid}:{tid}` | Каждое сообщение | userId, messageType, messageText, messageData, nodeId, id, createdAt |
| `bot:user:{pid}:{tid}` | Только первый визит | userId, username, firstName, lastName, avatarUrl, isBot, isPremium, languageCode, deepLinkParam, referrerId, registeredAt |
| `bot:logs:{pid}:{tid}` | Каждая строка лога | level, message, timestamp |
| `bot:started:{pid}:{tid}` | Запуск бота | projectId, tokenId, timestamp |
| `bot:stopped:{pid}:{tid}` | Остановка бота | projectId, tokenId, timestamp |

---

## Улучшения

### 🔴 Баги (Priority: High)

#### 1. `bot:message` не содержит `tokenId` в payload

**Проблема:** При нескольких ботах в одном проекте нельзя понять от какого бота пришло сообщение.
`tokenId` есть в названии канала (`bot:message:{pid}:{tid}`), но не в самом JSON.

**Решение:** Добавить `tokenId` в payload `save-message-to-api.py.jinja2`:
```python
_redis_payload = json.dumps({
    "tokenId": TOKEN_ID,   # ← добавить
    "userId": str(user_id),
    ...
})
```

**Файл:** `lib/templates/middleware/save-message-to-api.py.jinja2`

---

#### 2. `bot:user` не содержит `tokenId` в payload

**Проблема:** Та же проблема — `tokenId` есть в канале, но не в JSON.

**Решение:** Уже частично исправлено в Этапе 1 (`tokenId` добавлен в payload).
Проверить что `tokenId: TOKEN_ID` присутствует в `database.py.jinja2`.

**Файл:** `lib/templates/database/database.py.jinja2`

---

### 🟡 Новые события (Priority: Medium)

#### 3. Событие `bot:user:updated` — изменение данных пользователя

**Проблема:** Когда пользователь меняет username или имя в Telegram, данные в БД обновляются
при следующем визите, но UI не узнаёт об этом без полного refetch.

**Решение:** В `save_user_to_db` после UPDATE проверять изменились ли данные через `RETURNING`:

```sql
ON CONFLICT (user_id, project_id, token_id) DO UPDATE SET
    username = EXCLUDED.username,
    first_name = EXCLUDED.first_name,
    ...
RETURNING xmax,
    (bot_users.username IS DISTINCT FROM EXCLUDED.username) as username_changed,
    (bot_users.first_name IS DISTINCT FROM EXCLUDED.first_name) as name_changed
```

Если `username_changed OR name_changed` — публиковать:
```python
await _redis_client.publish(
    f"bot:user:updated:{PROJECT_ID}:{TOKEN_ID}",
    json.dumps({
        "type": "user-updated",
        "userId": str(user_id),
        "tokenId": TOKEN_ID,
        "username": username,
        "firstName": first_name,
        "lastName": last_name,
        "avatarUrl": avatar_url,
    })
)
```

**Файл:** `lib/templates/database/database.py.jinja2`

**Фронт:** Добавить обработку `user-updated` в `UserMessagesLiveContext` и `useLiveInvalidate`
— обновлять строку пользователя в таблице без полного refetch.

---

#### 4. Событие `bot:variable:changed` — изменение переменной пользователя

**Проблема:** Когда бот меняет переменную через `set_user_var`, UI не знает.
Полезно для live-обновления деталей пользователя в панели.

**Решение:** В `set_user_var` после записи публиковать:
```python
await _redis_client.publish(
    f"bot:variable:{PROJECT_ID}:{TOKEN_ID}",
    json.dumps({
        "type": "variable-changed",
        "userId": str(user_id),
        "tokenId": TOKEN_ID,
        "variableName": variable_name,
        "variableValue": variable_value,
    })
)
```

**Файл:** `lib/templates/utils/utils.py.jinja2`

**Осторожно:** `set_user_var` вызывается очень часто — нужно фильтровать
только "важные" переменные или добавить флаг `publishToRedis=True`.

---

### 🟢 Использование существующих событий (Priority: Low)

#### 5. `bot:started/stopped` не слушаются на фронте

**Проблема:** События есть, но UI их игнорирует. Статус бота обновляется только через поллинг.

**Решение:** Добавить подписку на `bot:started` и `bot:stopped` в `UserMessagesLiveContext`
или в отдельный хук `useBotStatusLive`. При получении события — обновлять статус бота
в карточке без перезагрузки страницы.

**Файлы:**
- `client/components/editor/database/user-database/contexts/user-messages-live-context.tsx`
- `client/components/editor/bot/hooks/use-bot-project-events.ts` (возможно уже есть)

---

#### 6. Нет события `bot:error`

**Проблема:** Критические ошибки бота не доходят до UI. Только через логи.

**Решение:** В `error-handler` шаблоне публиковать:
```python
await _redis_client.publish(
    f"bot:error:{PROJECT_ID}:{TOKEN_ID}",
    json.dumps({
        "type": "error",
        "message": str(error),
        "timestamp": datetime.utcnow().isoformat(),
    })
)
```

**Файл:** `lib/templates/error-handler/` (если есть)

---

## Приоритизация

### Сделать сейчас:
1. ✅ Добавить `tokenId` в `bot:message` payload (баг, 1 строка)
2. ✅ Событие `bot:user:updated` (полезно для live UI)

### Потом:
3. `bot:started/stopped` на фронте (статус бота в реальном времени)
4. `bot:variable:changed` (осторожно с нагрузкой)
5. `bot:error` (для мониторинга)

---

## Файлы для изменения

**Шаблоны:**
```
lib/templates/middleware/save-message-to-api.py.jinja2  ← tokenId в payload
lib/templates/database/database.py.jinja2               ← bot:user:updated
lib/templates/utils/utils.py.jinja2                     ← bot:variable:changed (опционально)
```

**Фронт:**
```
client/components/editor/database/user-database/contexts/user-messages-live-context.tsx
client/components/editor/database/user-database/hooks/use-live-invalidate.ts
```

---

## Дополнительные события (расширенный roadmap)

### 🔥 Аналитика поведения (Priority: High — основа для воронок)

#### `bot:node:visited` — посещение узла

Публиковать каждый раз когда пользователь попадает в узел сценария.
Основа для построения воронок и карты популярных узлов без отдельной таблицы `bot_events`.

```python
await _redis_client.publish(
    f"bot:node:{PROJECT_ID}:{TOKEN_ID}",
    json.dumps({
        "type": "node-visited",
        "userId": str(user_id),
        "tokenId": TOKEN_ID,
        "nodeId": node_id,
        "nodeType": node_type,   # "message" | "condition" | "input" | ...
        "timestamp": datetime.utcnow().isoformat(),
    })
)
```

**Где публиковать:** в `handle-node-function` шаблоне при входе в каждый узел.

**Что даёт:**
- Топ посещаемых узлов
- Воронка: сколько дошли от узла A до узла B
- Где пользователи "застревают" и выходят

---

#### `bot:button:clicked` — нажатие кнопки

Сейчас нажатие кнопки пишется в `bot_messages` как текст `[Нажата кнопка: X]`.
Нужно отдельное событие с структурированными данными.

```python
await _redis_client.publish(
    f"bot:button:{PROJECT_ID}:{TOKEN_ID}",
    json.dumps({
        "type": "button-clicked",
        "userId": str(user_id),
        "tokenId": TOKEN_ID,
        "buttonText": button_text,
        "callbackData": callback_data,
        "nodeId": node_id,
        "timestamp": datetime.utcnow().isoformat(),
    })
)
```

**Где публиковать:** в `callback_query_logging_middleware`.

**Что даёт:**
- Какие кнопки нажимают чаще всего
- A/B тест: какая формулировка кнопки работает лучше
- Тепловая карта кнопок по узлам

---

#### `bot:command:used` — использование команды

```python
await _redis_client.publish(
    f"bot:command:{PROJECT_ID}:{TOKEN_ID}",
    json.dumps({
        "type": "command-used",
        "userId": str(user_id),
        "tokenId": TOKEN_ID,
        "command": "/help",   # или "/start", "/menu" и т.д.
        "timestamp": datetime.utcnow().isoformat(),
    })
)
```

**Где публиковать:** в `command-trigger` шаблоне.

---

### 👤 Состояние пользователя (Priority: Medium)

#### `bot:user:blocked` / `bot:user:unblocked`

Telegram шлёт `my_chat_member` update когда пользователь блокирует бота.
Можно поймать и обновить `is_active = 0` в БД + опубликовать событие.

```python
# В обработчике my_chat_member
if new_status == "kicked":
    await _redis_client.publish(f"bot:user:blocked:{PROJECT_ID}:{TOKEN_ID}", ...)
elif new_status == "member":
    await _redis_client.publish(f"bot:user:unblocked:{PROJECT_ID}:{TOKEN_ID}", ...)
```

**Что даёт:** реальный счётчик заблокированных без ручного обновления.

---

#### `bot:user:state:changed` — смена FSM состояния

Полезно для отладки — видеть в реальном времени в каком состоянии находится пользователь.

```python
await _redis_client.publish(
    f"bot:state:{PROJECT_ID}:{TOKEN_ID}",
    json.dumps({
        "type": "state-changed",
        "userId": str(user_id),
        "tokenId": TOKEN_ID,
        "oldState": old_state,
        "newState": new_state,
    })
)
```

---

### 💳 Платежи (Priority: Low — только если используются Telegram Payments)

#### `bot:payment:received`

```python
# В обработчике successful_payment
await _redis_client.publish(
    f"bot:payment:{PROJECT_ID}:{TOKEN_ID}",
    json.dumps({
        "type": "payment-received",
        "userId": str(user_id),
        "tokenId": TOKEN_ID,
        "amount": payment.total_amount,
        "currency": payment.currency,
        "payload": payment.invoice_payload,
        "timestamp": datetime.utcnow().isoformat(),
    })
)
```

---

### ⚙️ Системные (Priority: Low)

#### `bot:rate:limited` — 429 от Telegram

```python
# В error handler при получении TelegramRetryAfter
await _redis_client.publish(
    f"bot:ratelimit:{PROJECT_ID}:{TOKEN_ID}",
    json.dumps({
        "type": "rate-limited",
        "retryAfter": retry_after,
        "timestamp": datetime.utcnow().isoformat(),
    })
)
```

**Что даёт:** алерт в UI когда бот начинает флудить.

---

#### `bot:memory:high` — предупреждение о памяти

```python
# В cleanup_user_data() если len(user_data) > порога
if len(user_data) > 10_000:
    await _redis_client.publish(
        f"bot:memory:{PROJECT_ID}:{TOKEN_ID}",
        json.dumps({
            "type": "memory-high",
            "userDataSize": len(user_data),
            "threshold": 10_000,
        })
    )
```

---

## Итоговая карта всех событий

```
bot:message:{pid}:{tid}     ✅ есть   — каждое сообщение
bot:user:{pid}:{tid}        ✅ есть   — новый пользователь
bot:logs:{pid}:{tid}        ✅ есть   — логи бота
bot:started:{pid}:{tid}     ✅ есть   — запуск бота
bot:stopped:{pid}:{tid}     ✅ есть   — остановка бота

bot:user:updated:{pid}:{tid} ⏳ план  — изменение данных пользователя
bot:node:{pid}:{tid}         ⏳ план  — посещение узла (воронки!)
bot:button:{pid}:{tid}       ⏳ план  — нажатие кнопки
bot:command:{pid}:{tid}      ⏳ план  — использование команды
bot:user:blocked:{pid}:{tid} ⏳ план  — блокировка бота пользователем
bot:state:{pid}:{tid}        ⏳ план  — смена FSM состояния
bot:payment:{pid}:{tid}      ⏳ план  — платёж
bot:ratelimit:{pid}:{tid}    ⏳ план  — rate limit
bot:memory:{pid}:{tid}       ⏳ план  — высокое потребление памяти
```

---

## Полная карта Telegram Update типов vs наши триггеры

### Все типы Update из Telegram Bot API (aiogram 3.7)

| Update тип | Что это | Триггер в редакторе | Redis событие |
|-----------|---------|---------------------|---------------|
| `message` | Входящее сообщение | ✅ `command_trigger`, `text_trigger`, `incoming_message_trigger` | ✅ `bot:message` |
| `edited_message` | Отредактированное сообщение | ❌ нет | ❌ нет |
| `channel_post` | Пост в канале | ❌ нет | ❌ нет |
| `edited_channel_post` | Отредактированный пост | ❌ нет | ❌ нет |
| `business_connection` | Подключение бизнес-аккаунта | ❌ нет | ❌ нет |
| `business_message` | Сообщение от бизнес-аккаунта | ❌ нет | ❌ нет |
| `edited_business_message` | Редактирование бизнес-сообщения | ❌ нет | ❌ нет |
| `deleted_business_messages` | Удаление бизнес-сообщений | ❌ нет | ❌ нет |
| `message_reaction` | Реакция на сообщение | ❌ нет | ❌ нет |
| `message_reaction_count` | Счётчик реакций | ❌ нет | ❌ нет |
| `inline_query` | Inline запрос | ❌ нет | ❌ нет |
| `chosen_inline_result` | Выбранный inline результат | ❌ нет | ❌ нет |
| `callback_query` | Нажатие inline кнопки | ✅ `callback_trigger`, `incoming_callback_trigger` | ✅ `bot:message` (как кнопка) |
| `shipping_query` | Запрос доставки (платежи) | ❌ нет | ❌ нет |
| `pre_checkout_query` | Предоплата (платежи) | ❌ нет | ❌ нет |
| `poll` | Изменение опроса | ❌ нет | ❌ нет |
| `poll_answer` | Ответ на опрос | ❌ нет | ❌ нет |
| `my_chat_member` | Изменение статуса бота в чате | ✅ частично (managed_bot) | ❌ нет |
| `chat_member` | Изменение статуса участника | ❌ нет | ❌ нет |
| `chat_join_request` | Запрос на вступление | ❌ нет | ❌ нет |
| `chat_boost` | Буст чата | ❌ нет | ❌ нет |
| `removed_chat_boost` | Удаление буста | ❌ нет | ❌ нет |

---

### Что стоит добавить в редактор (новые триггеры)

#### 🔥 High Priority

**`message_reaction` — реакция на сообщение**
Пользователь поставил 👍 или ❤️ на сообщение бота.
Можно использовать как триггер: "если поставил реакцию → выполнить сценарий".
```
Триггер: reaction_trigger
Условие: emoji == "👍" или любая реакция
```

**`poll_answer` — ответ на опрос**
Пользователь проголосовал в опросе который отправил бот.
Очень полезно для квизов и голосований.
```
Триггер: poll_answer_trigger
Переменная: poll_answer = "Вариант A"
```

**`chat_member` — изменение участника группы**
Пользователь вступил или вышел из группы.
Нужен для автоматической выдачи ролей, приветствий новых участников.
```
Триггер: chat_member_trigger
Условие: new_status == "member" (вступил) или "left" (вышел)
```

**`chat_join_request` — запрос на вступление**
Пользователь хочет вступить в закрытую группу/канал.
Можно автоматически одобрять или отклонять по условиям.
```
Триггер: join_request_trigger
Действие: approve / decline
```

---

#### 🟡 Medium Priority

**`edited_message` — редактирование сообщения**
Пользователь отредактировал своё сообщение.
Полезно для ботов где важна актуальность данных.

**`channel_post` — пост в канале**
Новый пост опубликован в канале где бот является администратором.
Можно автоматически обрабатывать посты: форматировать, пересылать, сохранять.

**`inline_query` — inline режим**
Пользователь вводит `@botname запрос` в любом чате.
Бот может отвечать результатами без открытия диалога.

---

#### 🟢 Low Priority

**`message_reaction_count` — счётчик реакций на посты канала**
Агрегированная статистика реакций (без имён пользователей).

**`chat_boost` / `removed_chat_boost` — буст канала**
Пользователь забустил канал Premium-подпиской.
Можно давать бонусы за буст.

**`shipping_query` / `pre_checkout_query` — платежи**
Обработка платежей через Telegram Payments.
Нужен отдельный узел `payment_node`.

---

### Новые Redis события для новых триггеров

```
bot:reaction:{pid}:{tid}      ← message_reaction (реакция на сообщение)
bot:poll_answer:{pid}:{tid}   ← poll_answer (ответ на опрос)
bot:join_request:{pid}:{tid}  ← chat_join_request (запрос на вступление)
bot:chat_member:{pid}:{tid}   ← chat_member (изменение участника)
bot:channel_post:{pid}:{tid}  ← channel_post (пост в канале)
bot:payment:{pid}:{tid}       ← pre_checkout_query (платёж)
```

---

### Текущие триггеры в редакторе (полный список)

Из папок `lib/templates/`:

| Шаблон | Тип триггера | Update тип |
|--------|-------------|-----------|
| `command-trigger` | Команда `/start`, `/help` и т.д. | `message` |
| `text-trigger` | Текстовое совпадение | `message` |
| `callback-trigger` | Нажатие inline кнопки | `callback_query` |
| `incoming-callback-trigger` | Любой callback | `callback_query` |
| `incoming-message-trigger` | Любое сообщение | `message` |
| `group-message-trigger` | Сообщение в группе | `message` (group) |
| `outgoing-message-trigger` | Исходящее сообщение | внутренний |
| `managed-bot-updated-trigger` | Обновление управляемого бота | `my_chat_member` |
| `animation-handler` | Анимация/GIF | `message` (animation) |
| `voice` | Голосовое сообщение | `message` (voice) |
| `media-input-handlers` | Медиафайлы | `message` (photo/video/doc) |
