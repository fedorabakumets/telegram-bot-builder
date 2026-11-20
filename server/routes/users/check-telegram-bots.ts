/** @fileoverview Ограниченная по параллельности проверка ботов с защитой от замены токена во время запроса. */
import type { BotToken } from '@shared/schema';
import type { TelegramBotCheckItem, TelegramBotCheckResult } from '@shared/telegram-bot-check';
import { pool } from '../../database/db';
import { emitTokenUpdated } from '../../terminal/emitTokenUpdated';
import { probeTelegramBot } from './probe-telegram-bot';
/**
 * Обновляет только подтверждённое состояние токена; успешная проверка не запускает и не включает бота.
 * @param token - Снимок записи токена до проверки.
 * @returns Безопасный результат без токена и исходного текста ошибки.
 */
async function checkOne(token: BotToken): Promise<TelegramBotCheckItem> {
  /** Проверка команд не зависит от известных Telegram личных чатов. */
  const detail: Pick<TelegramBotCheckItem, 'reason' | 'method' | 'errorCode'> = {};
  const probe = await probeTelegramBot(token.token, value => Object.assign(detail, value));
  if (probe === 'error' || probe === 'no_test_chat' || probe === 'chat_unavailable' || probe === 'rate_limited')
    return { tokenId: token.id, status: 'error', ...detail, reason: probe === 'error' ? detail.reason ?? 'error' : probe };
  const unavailable = probe !== 'available';
  const result = await pool.query(`UPDATE bot_tokens SET authorization_error=$3,
    is_active=CASE WHEN $5::boolean THEN 0 ELSE is_active END,updated_at=NOW()
    WHERE project_id=$1 AND id=$2 AND token=$4 RETURNING id`,
  [token.projectId, token.id, unavailable ? probe : null, token.token, unavailable]);
  if (!result.rowCount) return { tokenId: token.id, status: 'error', reason: 'token_changed' };
  await emitTokenUpdated({ projectId: token.projectId, tokenId: token.id, before: token, source: 'api' }).catch(() => undefined);
  return { tokenId: token.id, status: unavailable ? 'unavailable' : 'available', ...detail,
    reason: unavailable ? probe : undefined };
}
/**
 * Проверяет не более четырёх ботов одновременно, не прерывая остальные при отдельной ошибке.
 * @param tokens - Боты только авторизованного проекта.
 * @param onProgress - Безопасный промежуточный итог после каждого бота.
 * @param onItem - Обязательная запись результата до его публикации подписчикам.
 * @returns Сводка для обновления фильтра и интерфейса.
 */
export async function checkTelegramBots(tokens: BotToken[], onProgress?: (result: TelegramBotCheckResult) => void,
  onItem?: (item: TelegramBotCheckItem) => Promise<void>): Promise<TelegramBotCheckResult> {
  const items: TelegramBotCheckItem[] = new Array(tokens.length);
  let next = 0;
  /** Последовательно забирает работу из общей очереди. */
  async function worker() {
    while (next < tokens.length) {
      const index = next++;
      const startedAt = new Date().toISOString();
      const checked = await checkOne(tokens[index]).catch(() => ({ tokenId: tokens[index].id, status: 'error' as const }));
      const item = { ...checked, name: tokens[index].name, username: tokens[index].botUsername,
        startedAt, finishedAt: new Date().toISOString() };
      await onItem?.(item);
      items[index] = item;
      /** Неполные позиции не публикуются; ошибка подписчика не прерывает проверку. */
      const ready = items.filter(Boolean);
      try { onProgress?.({ items: ready, available: ready.filter(item => item.status === 'available').length,
        unavailable: ready.filter(item => item.status === 'unavailable').length, errors: ready.filter(item => item.status === 'error').length }); } catch { /* Проверка не зависит от подключения интерфейса. */ }
    }
  }
  /** Дожидаемся остальных работников даже при сбое записи, чтобы итог не обгонял сохранение. */
  const workers = await Promise.allSettled(Array.from({ length: Math.min(4, tokens.length) }, worker));
  const failed = workers.find(result => result.status === 'rejected');
  if (failed?.status === 'rejected') throw failed.reason;
  return { items, available: items.filter(item => item.status === 'available').length,
    unavailable: items.filter(item => item.status === 'unavailable').length, errors: items.filter(item => item.status === 'error').length };
}
