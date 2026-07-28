# Live-синхронизация настроек токена

После изменения настроек бота (срок хранения сообщений, auto-restart, protect-content и др.) карточки на вкладке «Боты» обновляются **без F5** — и при правке в UI, и при вызове MCP/API.

## Как это работает

1. HTTP PUT (или MCP → тот же API) успешно пишет в `bot_tokens`.
2. Сервер вызывает `emitTokenUpdated` → `broadcastProjectEvent({ type: 'token-updated', ... })`.
3. Локальные WebSocket-клиенты получают событие; при multi-instance — Redis `platform:project_event:{projectId}` разносит его на другие реплики Node.
4. Клиентские хуки инвалидируют `GET /api/projects/{id}/tokens`; локальный state селектов/тогглов синхронизируется с props.

Toast на агентские/чужие обновления **не** показывается (чтобы массовый апдейт 100+ токенов не засыпал уведомлениями).

## Безопасность

В WS payload только whitelist публичных полей. **Не передаются:** `token`, `webhookSecretToken`, `userbotApiHash`, `userbotSessionString`.

Контракт: `shared/project-sync/project-event.ts`.

## Источники правды (API)

- [docs/api/tokens.md](../api/tokens.md) — HTTP settings PUT
- [docs/api/realtime-events.md](../api/realtime-events.md) — WS / Redis / пример JSON
- MCP: `db_set_messages_retention` в [docs/mcp/bot-builder.md](../mcp/bot-builder.md)

## Ключевые файлы

| Слой | Файлы |
|------|--------|
| Shared | `shared/project-sync/project-event.ts` |
| Emit | `server/terminal/emitTokenUpdated.ts` |
| Broadcast | `server/terminal/broadcastProjectEvent.ts` |
| Redis | `server/redis/publishProjectEvent.ts`, `redisProjectEventBridge.ts` |
| Client | `client/hooks/use-project-events-ws.ts`, `use-all-projects-events-ws.ts`, карточки в `client/components/editor/bot/card/` |
