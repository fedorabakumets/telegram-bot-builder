# Webhook режим для ботов

Документ описывает переход с polling на webhook для генерируемых Python ботов.

---

## Проблема

Текущая архитектура запускает каждого бота как постоянный Python процесс с polling циклом.
Процесс живёт всё время пока бот "запущен" — даже когда никто не пишет боту.

**Последствия:**
- ~80MB RAM на каждый бот
- 100 ботов = ~8GB RAM
- При деплое боты падают и восстанавливаются через `restoreRunningBots`
- Distributed lock в Redis нужен чтобы не запустить два экземпляра

---

## Решение

Автоматическое переключение между polling и webhook по наличию `WEBHOOK_URL` в `.env`.

```
Локально (без WEBHOOK_URL):
  бот → dp.start_polling(bot)  — как сейчас

На Railway (с WEBHOOK_URL):
  Telegram → POST /api/webhook/{projectId}/{tokenId} (Node.js)
           → пересылает апдейт в Python HTTP сервер бота
           → Python обрабатывает сценарий → отвечает
```

Пользователь не думает об этом — локально работает polling, на Railway автоматически webhook.

---

## Плюсы webhook режима

- **Latency:** мгновенный отклик вместо задержки polling (~0.5 сек)
- **Надёжность деплоя:** при деплое Railway боты не падают — Telegram продолжает слать апдейты на тот же URL
- **Нет distributed lock:** нет проблемы двойного запуска через polling
- **Нет restoreRunningBots:** процессы восстанавливаются автоматически

> ⚠️ **Память не сокращается** при webhook без worker pool — процесс всё так же живёт постоянно (~80MB/бот).
> Экономия памяти достигается только при **webhook + worker pool** вместе (один Python процесс на 50+ ботов).

---

## Архитектура

### Python (генерируемый код)

`main.py.jinja2` — добавить условие:

```python
WEBHOOK_URL = os.getenv("WEBHOOK_URL")
WEBHOOK_PORT = int(os.getenv("WEBHOOK_PORT", "8080"))

async def main():
    if WEBHOOK_URL:
        # Webhook режим — запускаем aiohttp сервер
        from aiohttp import web
        from aiogram.webhook.aiohttp_server import SimpleRequestHandler, setup_application

        webhook_url = f"{WEBHOOK_URL}/api/webhook/{PROJECT_ID}/{TOKEN_ID}"
        await bot.set_webhook(webhook_url)

        app = web.Application()
        SimpleRequestHandler(dispatcher=dp, bot=bot).register(app, path="/webhook")
        setup_application(app, dp, bot=bot)
        web.run_app(app, host="0.0.0.0", port=WEBHOOK_PORT)
    else:
        # Polling режим — как сейчас
        await dp.start_polling(bot)
```

### Node.js

Новый роут для приёма апдейтов от Telegram:

```typescript
// POST /api/webhook/:projectId/:tokenId
// Telegram шлёт апдейт → Node.js пересылает в Python HTTP сервер бота
app.post('/api/webhook/:projectId/:tokenId', async (req, res) => {
  const { projectId, tokenId } = req.params;
  const botPort = getBotWebhookPort(projectId, tokenId);
  // Проксируем апдейт в Python процесс бота
  const response = await fetch(`http://localhost:${botPort}/webhook`, {
    method: 'POST',
    body: JSON.stringify(req.body),
    headers: { 'Content-Type': 'application/json' }
  });
  res.status(response.status).end();
});
```

### Управление портами

> ⚠️ Схема "один порт на бота" работает только при небольшом количестве ботов (до ~50000 портов ОС).
> При масштабировании до миллионов ботов нужен shared Python сервер (см. ниже).

**Для малого масштаба (до ~1000 ботов):**

Каждый бот получает уникальный порт для своего HTTP сервера:

```typescript
// Порт = базовый порт + tokenId
const BASE_WEBHOOK_PORT = 9000;
const getBotWebhookPort = (projectId: number, tokenId: number) =>
  BASE_WEBHOOK_PORT + tokenId;
```

**Для большого масштаба (1000+ ботов) — Shared Python сервер:**

Один Python процесс (worker) слушает один порт, внутри него зарегистрированы все боты:

```
Telegram → POST /api/webhook/{projectId}/{tokenId}
         → Node.js → Worker HTTP сервер (один порт)
                   → диспетчеризация по tokenId
                   → нужный bot dispatcher
```

Это объединяет webhook режим с worker pool архитектурой из `bot-worker-pool.md`.

### startBot.ts

При webhook режиме — вместо `spawn python3 bot.py` запускаем процесс с портом:

```typescript
env: {
  ...process.env,
  WEBHOOK_URL: process.env.WEBHOOK_URL,
  WEBHOOK_PORT: String(BASE_WEBHOOK_PORT + tokenId),
}
```

---

## Redis становится обязательным

При webhook FSM состояния и user_data **не могут** жить в памяти Python процесса — между апдейтами процесс может не существовать.

Redis уже реализован как опциональный. При webhook — делаем обязательным:

```python
# При webhook REDIS_URL обязателен
if WEBHOOK_URL and not REDIS_URL:
    raise RuntimeError("REDIS_URL обязателен при использовании webhook режима")
```

FSM хранилище (`RedisStorage`) и кэш переменных (`vars_cache`) уже реализованы — ничего менять не нужно.

---

## Локальная разработка

Без `WEBHOOK_URL` в `.env` — бот работает в polling режиме как сейчас. Никаких изменений для разработчика.

Для тестирования webhook локально — опционально использовать ngrok:
```bash
ngrok http 5000
# Затем добавить в .env:
# WEBHOOK_URL=https://abc123.ngrok.io
```

---

## Railway деплой

Railway автоматически предоставляет публичный HTTPS URL через `RAILWAY_PUBLIC_DOMAIN`.
Добавить в Railway переменные окружения:

```
WEBHOOK_URL=https://${RAILWAY_PUBLIC_DOMAIN}
```

---

## Что не меняется

- Весь код сценария — handlers, FSM, узлы — без изменений
- Редактор сценариев — без изменений
- UI управления ботами — без изменений
- Логи через Redis Pub/Sub — уже реализовано, работает в обоих режимах

---

## Ограничения webhook

- Telegram ждёт ответ максимум **60 секунд** — если сценарий дольше, нужен async ответ
- Telegram требует **HTTPS** — на Railway есть, локально нет без ngrok
- Один URL на бота — нельзя запустить два экземпляра (это плюс, не минус)

---

## Этапы реализации

### Фаза 1 — Python шаблон
- [x] Добавить `WEBHOOK_URL`, `WEBHOOK_PORT` в `config.py.jinja2`
- [x] Обновить `main.py.jinja2` — условное переключение polling/webhook
- [x] Добавить `aiohttp` в `requirements.txt` шаблон
- [x] Написать тесты для обоих режимов

### Фаза 2 — Node.js роут
- [x] Создать `server/routes/setupWebhookRoutes.ts`
- [x] Роут `POST /api/webhook/:projectId/:tokenId`
- [x] Проксирование апдейта в Python HTTP сервер бота
- [x] Управление портами ботов (`getBotWebhookPort`)

### Фаза 3 — startBot / stopBot
- [ ] Передавать `WEBHOOK_PORT` в env процесса
- [ ] При старте в webhook режиме — вызывать `setWebhook`
- [ ] При остановке — вызывать `deleteWebhook`
- [ ] Убрать distributed lock (не нужен при webhook)

### Фаза 4 — Redis обязательный
- [ ] Валидация: если `WEBHOOK_URL` задан — `REDIS_URL` обязателен
- [ ] Обновить документацию Railway деплоя

### Фаза 5 — Тестирование
- [ ] Тест polling режима (локально)
- [ ] Тест webhook режима (Railway или ngrok)
- [ ] Нагрузочный тест: 100 ботов в webhook режиме
