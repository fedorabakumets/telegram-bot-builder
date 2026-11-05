/**
 * @fileoverview Общий лимит отправок сообщений Telegram для каждого бота в процессе сервера.
 */

import { acquireRedisTelegramSlot, pauseRedisTelegramMessages } from "./telegram-message-limiter-redis";

/** Интервал между сообщениями при скорости 20 сообщений в секунду. */
const MESSAGE_INTERVAL_MS = 50;
/** Состояния очередей, разделённые по токену бота. */
const queues = new Map<string, { next: number; blockedUntil: number; tail: Promise<void> }>();

/**
 * Возвращает состояние ограничителя для бота.
 * @param token - Токен бота
 * @returns Состояние очереди бота
 */
function stateFor(token: string) {
  let state = queues.get(token);
  if (!state) {
    state = { next: 0, blockedUntil: 0, tail: Promise.resolve() };
    queues.set(token, state);
  }
  return state;
}

/**
 * Откладывает все следующие отправки бота после ответа Telegram 429.
 * @param token - Токен бота
 * @param seconds - Время ожидания в секундах
 * @returns Обещание завершения записи паузы
 */
export async function pauseTelegramMessages(token: string, seconds: number): Promise<void> {
  const state = stateFor(token);
  state.blockedUntil = Math.max(state.blockedUntil, Date.now() + Math.max(1, seconds) * 1000 + 250);
  await pauseRedisTelegramMessages(token, Math.max(1, seconds) * 1000 + 250);
}

/**
 * Ожидает разрешения отправить сообщения, учитывая параллельные запросы и размер альбома.
 * @param token - Токен бота
 * @param count - Количество сообщений в запросе
 * @returns Обещание, разрешающееся перед отправкой
 */
export async function waitForTelegramMessages(token: string, count = 1): Promise<void> {
  const state = stateFor(token);
  const turn = state.tail.then(async () => {
    while (true) {
      const delay = Math.max(state.next, state.blockedUntil) - Date.now();
      if (delay <= 0) break;
      await new Promise<void>(resolve => setTimeout(resolve, delay));
    }
    const interval = Math.max(1, count) * MESSAGE_INTERVAL_MS;
    while (true) {
      const delay = await acquireRedisTelegramSlot(token, interval);
      if (delay === null || delay <= 0) break;
      await new Promise<void>(resolve => setTimeout(resolve, delay));
    }
    state.next = Date.now() + interval;
  });
  state.tail = turn.catch(() => undefined);
  await turn;
}
