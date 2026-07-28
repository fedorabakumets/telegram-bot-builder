/**
 * @fileoverview Изоляция ботов в worker-pool (1 проект = 1 Python-воркер = N ботов)
 * @see [[futures/infrastructure/bot-worker-pool]]
 */

# Изоляция ботов в worker-pool

## Проблема

В одном Python-процессе крутятся все боты проекта. Без изоляции:

- `import config` попадал в общий `sys.modules` → чужой `BOT_TOKEN` / Redis lock
- root logger перезаписывался на каждый старт → логи клеились не на тот `token_id`
- worker-path `stopBot` не удалял Redis lock → «уже запущен» при рестарте
- `activeBots.delete` + `killWorker` до подтверждения Python → ложный `stopped` и убийство соседей
- `getLatestLaunchLogs` брал launch из строк логов → карточка «не пишет»

## Решение (runtime)

| Слой | Поведение |
|------|-----------|
| Python `worker.py` + `worker_isolation.py` | Уникальные модули `bot_{id}_*`, env под asyncio.Lock, contextvars для логов, `bot_started:{id}` |
| Node `botWorkerManager` | `activeBots` по `bot_started` / `bot_exited`; kill воркера только когда set пуст после Python; без fanout raw stdout |
| Node `clearBotRedisLock` | Удаление `bot:lock:{token[-10]}` в stop (worker+spawn), exit, restore |
| `getLatestLaunchLogs` | Последний launch из `bot_launch_history`; для `running` + строки с `launch_id IS NULL` |

## System-протокол воркера

- `worker_ready`
- `bot_started:{tokenId}`
- `bot_exited:{tokenId}:{status}`
- `bot_stopped:{tokenId}`
- `shutting_down` / `worker_exited` / `stdin_closed`

Логи бота: JSON `{"token_id", "type":"stdout"|"stderr", "content"}`.

## FSM Redis

Ключи: `fsm:state:{token_id}:{user_id}`, `fsm:data:{token_id}:{user_id}` (`RedisStorage(..., TOKEN_ID)`). Старые ключи без token_id истекают сами.

## Ops runbook (прод)

1. Stop всех токенов проекта (API `/bot/stop`).
2. Пауза ~45–60с (TTL lock / getUpdates).
3. Start по одному с паузой ≥1с (не полагаться на старый restart-all до выкладки фикса).
4. Проверить `GET /api/workers/stats` и статусы; у проблемного бота — свежие логи своего `tokenId`.
5. После деплоя шаблонов — перегенерировать/рестартнуть ботов, чтобы подтянуть новый `main` / FSM.

## Security

- Секрет токена не логировать; lock-ключ — только суффикс 10 символов.
- `clearBotRedisLock` только из stop/exit/restore с уже проверенным доступом к проекту.
- Логи одного `tokenId` не должны содержать stdout другого после фикса contextvars.
- `GET /api/workers/stats` не расширять полями с секретами.

## Связанные документы

- [[features/launch-history-status-reconciliation]]
- [[database/bot_logs]] / [[database/bot_launch_history]]
- [[api/bot-logs]] / [[api/workers]]
- [[interface/terminal]]
- [[mcp/bot-builder]]
