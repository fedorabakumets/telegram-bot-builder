# Bot Execution Modes — архитектура режимов запуска ботов

Единая концепция управления режимами запуска ботов через переменную окружения `BOT_MODE`.
Позволяет постепенно мигрировать от простой архитектуры к масштабируемой без изменений кода.

---

## Три режима

### `polling` (по умолчанию)
Текущая архитектура. Каждый бот — отдельный Python процесс с polling циклом.

```
Node.js → spawn python3 bot.py
Python  → dp.start_polling(bot)  # постоянно опрашивает Telegram
```

**Когда использовать:** локальная разработка, до ~50 ботов.

---

### `webhook`
Каждый бот — отдельный Python процесс с aiohttp HTTP сервером.
Telegram толкает апдейты через Node.js → Python.

```
Telegram → POST /api/webhook/{projectId}/{tokenId}  (Node.js)
         → http://localhost:{port}/webhook           (Python aiohttp)
```

**Когда использовать:** продакшн на Railway, нужен мгновенный отклик.

---

### `worker`
Несколько долгоживущих Python воркеров, каждый обслуживает множество ботов.
Апдейты приходят через webhook, диспетчеризируются по `tokenId`.

```
Telegram → POST /api/webhook/{projectId}/{tokenId}  (Node.js)
         → Worker HTTP сервер → нужный bot dispatcher
```

**Когда использовать:** 100+ ботов, нужна экономия памяти.

---

## Сравнение

| | polling | webhook | worker |
|---|---|---|---|
| **RAM/бот** | ~80MB | ~80MB | ~3MB |
| **Latency** | ~0.5 сек | мгновенно | мгновенно |
| **Изоляция** | ✅ Полная | ✅ Полная | ⚠️ Shared процесс |
| **Локально** | ✅ Без настройки | ❌ Нужен туннель | ❌ Нужен туннель |
| **Деплой** | restoreRunningBots | ✅ Прозрачный | ✅ Прозрачный |
| **Redis** | Опционально | Обязателен | Обязателен |
| **Сложность** | Низкая | Средняя | Высокая |

---

## Управление через `.env`

```bash
# Локальная разработка
BOT_MODE=polling

# Railway продакшн (webhook)
BOT_MODE=webhook
WEBHOOK_URL=https://myapp.railway.app

# Railway продакшн (worker pool)
BOT_MODE=worker
WEBHOOK_URL=https://myapp.railway.app
MAX_BOTS_PER_WORKER=50
```

---

## Node.js — startBot.ts

```typescript
const mode = process.env.BOT_MODE ?? 'polling';

switch (mode) {
  case 'polling':
    // spawn python3 bot.py — текущая реализация
    return spawnPollingBot(projectId, token, tokenId);

  case 'webhook':
    // spawn python3 bot.py с WEBHOOK_PORT
    // + вызов setWebhook через Telegram API
    return spawnWebhookBot(projectId, token, tokenId);

  case 'worker':
    // отправить команду start_bot в botWorkerManager
    return workerManager.startBot(projectId, token, tokenId);
}
```

---

## Python — генерируемый bot.py

Один файл поддерживает все три режима:

```python
BOT_MODE = os.getenv("BOT_MODE", "polling")
WEBHOOK_URL = os.getenv("WEBHOOK_URL")
WEBHOOK_PORT = int(os.getenv("WEBHOOK_PORT", "8080"))

async def main():
    # Инициализация одинакова для всех режимов
    await init_database()
    register_handlers(dp)

    if BOT_MODE == "webhook" and WEBHOOK_URL:
        # Webhook режим — aiohttp сервер
        from aiohttp import web
        from aiogram.webhook.aiohttp_server import SimpleRequestHandler

        webhook_url = f"{WEBHOOK_URL}/api/webhook/{PROJECT_ID}/{TOKEN_ID}"
        await bot.set_webhook(webhook_url)

        app = web.Application()
        SimpleRequestHandler(dispatcher=dp, bot=bot).register(app, path="/webhook")
        runner = web.AppRunner(app)
        await runner.setup()
        site = web.TCPSite(runner, "0.0.0.0", WEBHOOK_PORT)
        await site.start()
        await asyncio.Event().wait()  # ждём бесконечно

    elif BOT_MODE == "worker":
        # Worker режим — модуль загружается воркером
        # Этот блок не выполняется напрямую
        pass

    else:
        # Polling режим — по умолчанию
        await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
```

---

## Redis при разных режимах

| Режим | FSM | user_data | lock |
|---|---|---|---|
| polling | Redis или PostgreSQL | В памяти или Redis | Redis (реализован) |
| webhook | **Redis обязателен** | **Redis обязателен** | Не нужен |
| worker | **Redis обязателен** | **Redis обязателен** | Не нужен |

При `BOT_MODE=webhook` или `BOT_MODE=worker` — валидация при старте:
```python
if BOT_MODE in ("webhook", "worker") and not REDIS_URL:
    raise RuntimeError("REDIS_URL обязателен при BOT_MODE=webhook/worker")
```

---

## Путь миграции

```
Этап 1: polling (сейчас)
  → Работает локально и на Railway
  → До ~50 ботов

Этап 2: webhook (следующий шаг)
  → Добавить BOT_MODE=webhook в Railway env
  → Мгновенный отклик, надёжный деплой
  → Те же ~80MB/бот

Этап 3: worker (при росте)
  → Переключить BOT_MODE=worker
  → ~3MB/бот, 100+ ботов на одном сервере
  → Требует реализации botWorkerManager.ts
```

Каждый этап — одна переменная в `.env`. Код платформы и генерируемый Python код поддерживают все три режима.

---

## Статус реализации

| Режим | Python шаблон | Node.js | Статус |
|---|---|---|---|
| polling | ✅ Готов | ✅ Готов | **В продакшне** |
| webhook | ⬜ Нужно добавить | ⬜ Нужен роут + setWebhook | Запланировано |
| worker | ⬜ Нужен worker.py | ⬜ Нужен botWorkerManager.ts | Запланировано |

## См. также

- [`webhook-mode.md`](./webhook-mode.md) — детали webhook реализации
- [`bot-worker-pool.md`](./bot-worker-pool.md) — детали worker pool реализации
