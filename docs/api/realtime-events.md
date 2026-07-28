# Realtime events (WebSocket)

События проекта доставляются клиентам через terminal WebSocket и (между репликами Node) через Redis.

## Транспорт

- **URL:** `/api/terminal?projectId={id}&tokenId=0` (события проекта) или `projectId=0&tokenId=0` (все проекты пользователя).
- **Auth:** сессионная cookie (как у HTTP API).
- **Получатели:** владелец проекта и коллабораторы с доступом (`broadcastProjectEvent`).

## Multi-instance (Redis)

После локальной рассылки сервер публикует событие в Redis:

`platform:project_event:{projectId}`

Другие реплики Node подписываются на `platform:project_event:*` и делают только **local** WS fan-out. Anti-loop: поле `originInstanceId` — своё сообщение пропускается.

Если `REDIS_URL` не задан — работает только local fan-out (single-node / dev).

Каналы `bot:*` — отдельный контур (Python-бот → сервер), не путать с `platform:project_event`.

## Тип `token-updated`

Эмитится после успешного изменения настроек токена (PUT messages-retention, auto-restart, protect-content, save-incoming-media, catch-all, content-cache, userbot, log-level, launch-settings, generic PUT token, set-default, env-batch при изменении полей токена).

### Пример payload

```json
{
  "type": "token-updated",
  "projectId": 266,
  "tokenId": 170,
  "timestamp": "2026-07-28T03:00:00.000Z",
  "eventId": "uuid",
  "originInstanceId": "uuid-instance",
  "data": {
    "changedFields": ["messagesRetentionDays"],
    "token": {
      "id": 170,
      "projectId": 266,
      "name": "Alex Crypto Bot Demo",
      "botUsername": "btbtbtrbbbbot",
      "botFirstName": "Alex Crypto Bot Demo",
      "isDefault": 0,
      "isActive": 1,
      "messagesRetentionDays": 7,
      "autoRestart": 0,
      "maxRestartAttempts": 3,
      "logLevel": "DEBUG",
      "protectContent": 0,
      "saveIncomingMedia": 0,
      "catchAllHandlers": 1,
      "contentCache": 1,
      "launchMode": "polling",
      "webhookBaseUrl": null,
      "userbotEnabled": 0
    },
    "source": "api"
  }
}
```

### Безопасность payload

**Никогда не передаются:** `token`, `webhookSecretToken`, `userbotApiHash`, `userbotSessionString`, значения секретных env.

Контракт TypeScript: `shared/project-sync/project-event.ts` (`toTokenUpdatedPayload`).

### Поведение UI

Клиенты (`use-project-events-ws`, `use-all-projects-events-ws`) при `token-updated` инвалидируют `GET /api/projects/{id}/tokens` — карточки ботов подтягивают новые настройки без перезагрузки. Toast на чужие/агентские обновления не показывается.

## Связанные документы

- [tokens.md](./tokens.md) — HTTP settings PUT
- [features/token-settings-realtime.md](../features/token-settings-realtime.md) — обзор
- [mcp/bot-builder.md](../mcp/bot-builder.md) — MCP `db_set_messages_retention`
