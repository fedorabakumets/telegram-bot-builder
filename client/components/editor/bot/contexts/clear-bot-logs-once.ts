/**
 * @fileoverview Защита от повторной очистки логов при двойном bot-started
 * @module bot/contexts/clear-bot-logs-once
 */

/** Время последней очистки по ключу projectId-tokenId */
const lastClearAt = new Map<string, number>();

/** Окно, в котором повторный clear игнорируется (мс) */
const CLEAR_COOLDOWN_MS = 15_000;

/**
 * Очищает логи бота не чаще одного раза за CLEAR_COOLDOWN_MS.
 * Нужно потому что bot-started приходит дважды: из startBot и из Redis bot:started.
 * @param clearLogs - Функция очистки из BotLogsContext
 * @param projectId - ID проекта
 * @param tokenId - ID токена
 * @returns true если очистка выполнена
 */
export function clearBotLogsOnce(
  clearLogs: (key: string) => void,
  projectId: number,
  tokenId: number,
): boolean {
  const key = `${projectId}-${tokenId}`;
  const now = Date.now();
  const prev = lastClearAt.get(key) ?? 0;
  if (now - prev < CLEAR_COOLDOWN_MS) {
    return false;
  }
  lastClearAt.set(key, now);
  clearLogs(key);
  return true;
}
