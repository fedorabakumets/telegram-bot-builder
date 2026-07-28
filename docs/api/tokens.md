# tokens

Эндпоинтов настроек токена (settings) + общие CRUD токена.

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT (`MCP_AGENT_TOKEN`), если не указано иное.  
**Владение:** settings-маршруты с `requireTokenOwnership` (доступ сверяется с реальным `projectId` токена).

**Realtime side-effect:** после успешного изменения настроек сервер эмитит WebSocket-событие `token-updated` (безопасный снимок без секретов). Подробности: [realtime-events.md](./realtime-events.md). UI обновляется без F5; MCP: `db_set_messages_retention` и др.

---

### `PUT` /api/projects/{projectId}/tokens/{tokenId}/messages-retention

Срок хранения сообщений диалога (`bot_messages`).

**Тело:** `{ "messagesRetentionDays": 0 | 7 | 30 | 60 | 90 | 180 | 365 }`  
`0` — безлимит. Аналитика `message_activity_daily` не трогается. Перезапуск бота не нужен.

**Side-effect:** `token-updated` с `changedFields: ["messagesRetentionDays"]`.


| Код | Описание |
|-----|----------|
| 200 | `{ success: true, messagesRetentionDays }` |
| 400 | Неверные данные / значение вне whitelist |
| 401 / 403 / 404 | Auth / доступ / не найден |

---

### `PUT` /api/projects/{projectId}/tokens/{tokenId}/auto-restart

**Тело:** `{ "autoRestart": 0|1, "maxRestartAttempts": 1..10 }`  
**Side-effect:** `token-updated` (`autoRestart`, `maxRestartAttempts`).

---

### `PUT` /api/projects/{projectId}/tokens/{tokenId}/protect-content

**Тело:** `{ "protectContent": 0|1 }`  
**Side-effect:** `token-updated`. Может обновить `.env` бота (`PROTECT_CONTENT`).

---

### `PUT` /api/projects/{projectId}/tokens/{tokenId}/save-incoming-media

**Тело:** `{ "saveIncomingMedia": 0|1 }`  
**Side-effect:** `token-updated`.

---

### `PUT` /api/projects/{projectId}/tokens/{tokenId}/catch-all-handlers

**Тело:** `{ "catchAllHandlers": 0|1 }`  
**Side-effect:** `token-updated`. Обычно нужен перезапуск бота для применения кода.

---

### `PUT` /api/projects/{projectId}/tokens/{tokenId}/content-cache

**Тело:** `{ "contentCache": 0|1 }`  
**Side-effect:** `token-updated`.

---

### `PUT` /api/projects/{projectId}/tokens/{tokenId}/userbot

Настройки Telethon userbot (enabled / api id / hash / session).  
**Side-effect:** `token-updated` (в payload только `userbotEnabled`, **не** hash/session).

---

### `PUT` /api/projects/{projectId}/tokens/{tokenId}/log-level

**Тело:** `{ "logLevel": "DEBUG"|"INFO"|"WARNING"|"ERROR" }`  
**Side-effect:** `token-updated`.

---

### `PUT` /api/projects/{projectId}/tokens/{tokenId}/launch-settings

**Тело:** `{ "launchMode": "polling"|"webhook", "webhookBaseUrl"?, "webhookSecretToken"? }`  
**Side-effect:** `token-updated` (в payload есть `launchMode` и `webhookBaseUrl`, **не** `webhookSecretToken`).

---

### `PUT` /api/projects/{id}/tokens/{tokenId}

Частичное обновление токена (zod `insertBotTokenSchema.partial()`).  
**Side-effect:** `token-updated` (diff whitelist-полей).

### `PUT` /api/tokens/{id}

То же по глобальному id токена.  
**Side-effect:** `token-updated`.

### `POST` /api/projects/{projectId}/tokens/{tokenId}/set-default

**Side-effect:** `token-updated` (`isDefault`).

### `PUT` /api/projects/{projectId}/tokens/{tokenId}/env-batch

Пакетное обновление env / системных полей токена.  
**Side-effect:** `token-updated`, если среди результатов есть обновления полей токена.

---

### `DELETE` /api/tokens/{id}

Удаление токена.

### `GET` /api/tokens/{tokenId}/bot-status

Статус бота (без секрета token).

### `GET` /api/tokens/{tokenId}/launch-history

История запусков.
