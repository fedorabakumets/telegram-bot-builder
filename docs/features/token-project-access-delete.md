/**
 * @fileoverview Удаление токенов бота: доступ по проекту (владелец/коллаборатор)
 * @description DELETE использует `requireTokenOwnership` / `hasProjectAccess`,
 * как POST/PUT. Сырой Telegram token не отдаётся в list/status (маска).
 */

## Поток

1. UI / MCP → `DELETE /api/projects/{projectId}/tokens/{tokenId}`
2. Middleware `requireTokenOwnership` → реальный `projectId` токена → `hasProjectAccess`
3. Хендлер сверяет URL `projectId` с токеном (404 при несовпадении)
4. `stopBot` → `deleteBotToken` → WS `token-deleted`

## Безопасность

- Коллаборатор может удалять токены проекта (как создавать/менять настройки)
- Посторонний — 403
- IDOR по чужому `projectId` в URL — 404
- `GET .../tokens` и `bot-status.instance` без сырого `token` (маска / omit)
- `GET /api/projects/:id/bot/statuses` — те же публичные инстансы списком, доступ через `requireProjectAccess`
- MCP `db_delete_bot_token` только с `confirm: true`

## Источники правды

- [projects.md](../api/projects.md) — HTTP DELETE
- [tokens.md](../api/tokens.md) — list DTO
- [realtime-events.md](../api/realtime-events.md) — `token-deleted`
- [bot-builder.md](../mcp/bot-builder.md) — MCP

## Ключевые файлы

| Файл | Роль |
|------|------|
| `server/routes/botTokens/handlers/deleteProjectTokenHandler.ts` | DELETE project-scoped |
| `server/routes/botTokens/to-public-bot-token.ts` | DTO без секретов |
| `server/middleware/requireResourceOwnership.ts` | ACL |
| `lib/bot-tools/bot-runtime-db.ts` | `deleteBotTokenInDb` |
