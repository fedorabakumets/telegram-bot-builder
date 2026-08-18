# Массовый запуск офлайн-ботов

Кнопка **«Запустить офлайн»** в шапке проекта и MCP `db_start_offline_bots` поднимают только остановленных ботов текущего проекта с **действительным токеном**. Уже **running** и боты с **недействительным токеном** (`isActive === 0`) не трогаются (для running — «Перезапустить» / `db_restart_all_bots`).

## Поток

1. UI confirm / MCP `confirm: true` → `POST /api/projects/:id/bot/start-offline-all`
2. Сервер фильтрует токены с `status !== running` и `isActive !== 0`, последовательно вызывает `startBot`
3. На каждый успех — WS `bot-started` (карточки live)
4. Во время цикла — WS `start-offline-progress` (счётчики без секретов)
5. Redis `platform:project_event:{projectId}` разносит события на другие реплики Node

## Источники правды

- [docs/api/projects.md](../api/projects.md) — HTTP
- [docs/api/realtime-events.md](../api/realtime-events.md) — WS payload
- [docs/mcp/bot-builder.md](../mcp/bot-builder.md) — MCP тул

## Ключевые файлы

| Слой | Файлы |
|------|--------|
| Shared | `shared/project-sync/project-event.ts` |
| Handler | `server/routes/botManagement/handlers/botStartOfflineAllHandler.ts` |
| MCP | `lib/bot-tools/bot-runtime-db.ts`, `tools/mcp-server/index.ts` |
| UI | `client/components/editor/bot/project/ProjectHeader.tsx` |
