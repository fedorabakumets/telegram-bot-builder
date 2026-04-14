# Redis — Roadmap улучшений платформы

Документ описывает все возможные улучшения платформы с использованием Redis (Memurai на Windows, Redis на Linux/Railway).

---

## Уже реализовано ✅

### FSM хранилище (RedisStorage)
Состояния aiogram FSM хранятся в Redis с TTL 24 часа.
- Ключи: `fsm:state:{user_id}`, `fsm:data:{user_id}`
- Переживают перезапуск бота
- Синхронизируются с `user_data` для совместимости

### Кэш переменных пользователя
`init_all_user_vars` использует Redis как кэш вместо `_vars_cache` в памяти.
- Ключ: `vars_cache:{user_id}` с TTL `VARS_CACHE_TTL` секунд
- Инвалидируется при `set_user_var`
- Fallback на `_vars_cache` в памяти если Redis недоступен

### Distributed lock при старте
Защита от двойного запуска бота.
- Ключ: `bot:lock:{последние 10 символов токена}` с TTL 60 секунд
- Атомарный `SET NX` — только один процесс получает lock
- Фоновая задача `_refresh_lock` обновляет TTL каждые 30 секунд
- Lock освобождается в `finally` при завершении

### Pub/Sub для событий платформы
Python бот публикует события в Redis, сервер подписан и рассылает через WebSocket.
- Каналы: `bot:started:{projectId}:{tokenId}`, `bot:stopped:{projectId}:{tokenId}`, `bot:error:{projectId}:{tokenId}`
- Сервер подписан через паттерн `bot:*` — один subscriber на все боты
- Fallback: если `REDIS_URL` не задан — события идут напрямую через `broadcastProjectEvent` в `startBot.ts`/`stopBot.ts`
- Файлы: `server/redis/redisClient.ts`, `server/redis/redisPlatformSubscriber.ts`, `lib/templates/main/main.py.jinja2`

### Pub/Sub для real-time логов
Python бот публикует каждую строку лога в Redis через `_RedisLogHandler`, сервер подписан и рассылает в WebSocket-терминалы.
- Канал: `bot:logs:{projectId}:{tokenId}`
- `_RedisLogHandler` регистрируется в `logging.getLogger()` при старте бота если Redis доступен
- Сервер подписан через паттерн `bot:logs:*` — один subscriber на все боты
- Работает параллельно с stdout/pipe — дополнительный канал, не замена
- Если сервер перезапустится пока бот работает — логи продолжат идти через Redis
- Fallback: если Redis недоступен — логи идут только через stdout как раньше
- Файлы: `server/redis/redisLogsSubscriber.ts`, `server/redis/waitForRedis.ts`, `lib/templates/utils/utils.py.jinja2`

---

## Запланировано 🔜

### 1. Pub/Sub для real-time логов

**Проблема:** сейчас логи идут через `stdout → pipe → Node.js → WebSocket`. При перезапуске сервера pipe рвётся.

**Решение:**
```python
# Бот публикует логи в Redis канал
await redis_client.publish(f"bot:logs:{PROJECT_ID}:{TOKEN_ID}", json.dumps({
    "level": "INFO",
    "message": "🔵 Переход к узлу project-card-running",
    "timestamp": datetime.now().isoformat()
}))
```
```typescript
// Сервер подписан и пушит в WebSocket
subscriber.subscribe(`bot:logs:${projectId}:${tokenId}`, (msg) => ws.send(msg));
```

**Преимущества:**
- Несколько браузеров видят одни логи одновременно
- Сервер может перезапуститься — бот продолжает публиковать
- Нет буферизации stdout

> ✅ **Реализовано** — см. секцию "Уже реализовано"
- История последних N логов через `LPUSH` + `LTRIM`

**Файлы:** `lib/templates/utils/utils.py.jinja2`, `server/websocket/`

---

### 2. Rate limiting для узлов сценария

**Идея:** новый узел `rate_limit` в редакторе. Пользователь настраивает: "не чаще 3 раз в 10 секунд".

```python
# Генерируется в обработчике узла
_rl_key = f"rate:{user_id}:{node_id}"
_rl_count = await _redis_client.incr(_rl_key)
if _rl_count == 1:
    await _redis_client.expire(_rl_key, 10)  # окно 10 секунд
if _rl_count > 3:
    await callback_query.answer("⏳ Слишком часто, подождите немного", show_alert=True)
    return
```

**Применение:** защита от спама кнопками, ограничение запросов к API.

**Файлы:** новый шаблон `lib/templates/rate-limit/`, новый тип узла в редакторе

---

### 3. Express сессии в Redis

**Проблема:** сессии Node.js сервера хранятся в памяти — теряются при перезапуске.

**Решение:** `connect-redis` + `express-session`
```typescript
import RedisStore from 'connect-redis';
app.use(session({
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
}));
```

**Преимущества:**
- Сессии переживают перезапуск сервера
- Шарятся между несколькими инстансами сервера
- Пользователи не разлогиниваются при деплое

**Файлы:** `server/routes/routes.ts`, `package.json` (добавить `connect-redis`)

---

### 4. Счётчики и аналитика в реальном времени

**Идея:** узел `redis_counter` который инкрементирует счётчик без записи в PostgreSQL.

```python
# Счётчик нажатий кнопки
await _redis_client.incr(f"counter:{PROJECT_ID}:{node_id}")
# Уникальные пользователи за день
await _redis_client.sadd(f"users:{PROJECT_ID}:{today}", str(user_id))
```

**Применение:** статистика без нагрузки на PostgreSQL, дашборд в реальном времени.

---

### 5. Отложенные сообщения (Scheduled tasks)

**Идея:** пользователь просит напомнить через час — задача кладётся в Redis Sorted Set с timestamp.

```python
# Добавить задачу
score = time.time() + 3600  # через час
await _redis_client.zadd("scheduled_tasks", {json.dumps({
    "user_id": user_id,
    "message": "Напоминание!",
    "node_id": "reminder-node"
}): score})
```

Воркер проверяет каждую минуту через `ZRANGEBYSCORE`.

**Файлы:** новый шаблон `lib/templates/schedule/`, фоновый воркер в боте

---

### 6. Shared user_data для worker pool

**Контекст:** когда появится worker pool (`docs/futures/bot-worker-pool.md`) — несколько Python процессов одного бота будут шарить состояние.

**Решение:** `user_data` переедет из памяти Python в Redis Hash:
```python
# Вместо user_data[user_id][key] = value
await _redis_client.hset(f"user:{PROJECT_ID}:{user_id}", key, str(value))

# Вместо user_data.get(user_id, {})
data = await _redis_client.hgetall(f"user:{PROJECT_ID}:{user_id}")
```

**Это самое большое изменение** — затронет все шаблоны. Имеет смысл только при реальной нагрузке с несколькими воркерами.

---

### 7. Pub/Sub для событий платформы

**Идея:** события между ботами и сервером через Redis каналы.

```
bot:started:{projectId}:{tokenId}
bot:stopped:{projectId}:{tokenId}
bot:error:{projectId}:{tokenId}
user:message:{projectId}
```

Сервер подписан на все каналы → обновляет UI в реальном времени без polling.

**Применение:** статус ботов в UI обновляется мгновенно без `setInterval`.

> ✅ **Реализовано** — см. секцию "Уже реализовано"

---

## Приоритеты

| # | Задача | Сложность | Ценность |
|---|--------|-----------|----------|
| 3 | Express сессии в Redis | Низкая | Высокая |
| 1 | Pub/Sub для логов | ~~Средняя~~ | ~~Высокая~~ | ✅ Готово |
| 2 | Rate limiting | Средняя | Средняя |
| 4 | Счётчики аналитики | Низкая | Средняя |
| 5 | Отложенные сообщения | Высокая | Высокая |
| 7 | Pub/Sub для событий | ~~Средняя~~ | ~~Средняя~~ | ✅ Готово |
| 6 | Shared user_data | Очень высокая | Высокая (при масштабе) |
