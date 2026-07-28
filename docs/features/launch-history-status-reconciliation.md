/**
 * @fileoverview Синхронизация bot_launch_history с live-статусом бота
 * @description Устраняет рассинхрон «ОФЛАЙН в шапке» / «ОНЛАЙН в Истории».
 */

## Проблема

Шапка берёт live `bot-status`. Вкладка «История → Текущий» раньше брала первую
запись `status=running` из БД. После краша/рестарта сервера orphans оставались
`running` без `stoppedAt` → ложный «Онлайн».

## Решение (слои)

1. **Write:** bulk-close всех `running` при stop/exit/shutdown/start-fail
2. **Read:** `reconcileLaunchHistoryForToken` в status и GET launch-history
3. **Startup:** sweep orphans после `restoreRunningBots`
4. **UI:** `isLiveRunning` — offline никогда не показывает orphan как «Онлайн»

## Источники правды

- [bot_launch_history.md](../database/bot_launch_history.md)
- [bot.md](../interface/bot.md)
- [tokens.md](../api/tokens.md) — GET launch-history (self-heal)

## Ключевые файлы

| Файл | Роль |
|------|------|
| `server/bots/reconcileLaunchHistory.ts` | Сверка |
| `server/bots/closeActiveLaunchHistory.ts` | Bulk close |
| `server/bots/handleWorkerBotExited.ts` | Exit + fallback DB |
| `client/.../select-current-launch.ts` | UI gate |
