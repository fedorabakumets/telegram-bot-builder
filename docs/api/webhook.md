# webhook

Эндпоинтов: **1**

### `POST` /api/webhook/{projectId}/{tokenId}

Приём апдейта Telegram (webhook режим)

**Авторизация:** Публичный

**Публичный** эндпоинт — Telegram Server API шлёт сюда POST без cookie и без PAT. Путь в allowlist `requireApiAuth` (`/webhook/`).

**Когда используется:** только если токен бота в настройках запуска имеет `launchMode: webhook`. При старте бот регистрирует в Telegram URL:
`{webhookBaseUrl}/api/webhook/{projectId}/{tokenId}`

**Поток:**
1. Telegram → POST этот URL с JSON Update
2. Node.js (`setupWebhookRoutes`) проксирует body на `http://localhost:{9000+tokenId}/webhook`
3. Python aiohttp + aiogram (`SimpleRequestHandler`) обрабатывает сценарий

**UI:** превью URL в `BotLaunchSettings` (`buildWebhookPreview`).

**Порт Python:** `9000 + tokenId` (константа `BASE_WEBHOOK_PORT` в `setupWebhookRoutes.ts`). В Worker Pool каждый бот внутри `worker.py` поднимает свой aiohttp на этом порту.

**Ответ:** обычно **пустое body** — статус копируется с Python-сервера или `200` при ошибке прокси (чтобы Telegram не ретраил апдейт, если процесс бота недоступен).

**Безопасность:** Node **не** проверяет `webhookSecretToken` из настроек токена — секрет можно задать только при `set_webhook` на стороне бота (отдельная задача). Не публикуйте URL без TLS на production.

**Polling vs webhook:** при `launchMode: polling` этот URL не регистрируется в Telegram; эндпоинт может оставаться доступным, но апдейты не приходят.

**Тело запроса:** `TelegramWebhookUpdate`

**Параметры:** 2

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Апдейт принят. Body обычно пустое. При недоступном Python-боте Node всё равно отвечает 200 (защита от бесконечных ретраев Telegram). Статус может совпадать с ответом aiohttp. |
| 400 | Некорректные `projectId` или `tokenId` в path (не число) |
| 503 | Глобальный `setupGuard` — приложение ещё не настроено через `/setup`. До завершения setup webhook с production не работает. |
