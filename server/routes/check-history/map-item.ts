/** @fileoverview Безопасные подробности результатов бота, включая прерванные и ещё не начатые проверки. */
import type { TelegramBotCheckItem } from '@shared/telegram-bot-check';
import { historyTime, type HistoryRow } from './map-entry';
/** Причины не содержат сырые сообщения Telegram или URL. */
const reasons = new Set(['no_test_chat', 'chat_unavailable', 'rate_limited', 'error', 'timeout', 'network',
  'telegram_error', 'invalid_response', 'unauthorized', 'telegram_frozen', 'bot_deactivated', 'token_changed']);
/** Проецирует ожидающую строку в неопределённый результат без времени завершения. @param row - Явные столбцы результата. @returns Публичная строка. */
export function mapHistoryItem(row: HistoryRow): TelegramBotCheckItem {
  const reason = typeof row.reason === 'string' && reasons.has(row.reason) ? row.reason as TelegramBotCheckItem['reason'] : undefined;
  return { tokenId: Number(row.token_id), name: typeof row.name === 'string' ? row.name : undefined,
    username: typeof row.username === 'string' ? row.username : null,
    status: row.status === 'available' || row.status === 'unavailable' ? row.status : 'error', reason,
    method: ['getMe', 'getMyCommands', 'setMyCommands'].includes(String(row.method)) ? String(row.method) : undefined,
    errorCode: typeof row.error_code === 'number' ? row.error_code : undefined,
    startedAt: historyTime(row.started_at), finishedAt: historyTime(row.finished_at) };
}
