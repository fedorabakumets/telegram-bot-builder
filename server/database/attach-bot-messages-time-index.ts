/**
 * @fileoverview Запуск индекса сообщений в фоне после готовности HTTP.
 */
import type { Server } from 'node:http';
import { ensureBotMessagesTimeIndex } from './bot-messages-time-index';

/** Запуск сразу после готовности HTTP без блокировки обработчика события. */
const INITIAL_DELAY_MS = 0;
/** Пауза перед повтором после ошибки или занятости другой репликой. */
const RETRY_DELAY_MS = 5 * 60_000;

/**
 * Подключает фоновую попытку и повтор при сбое без задержки HTTP-ответов.
 * @param server - HTTP-сервер приложения.
 * @returns Завершение регистрации обработчиков.
 */
export function attachBotMessagesTimeIndex(server: Server): void {
  if (process.env.BOT_MESSAGES_TIME_INDEX_ENABLED === 'false') return;
  let timer: NodeJS.Timeout | undefined;
  let closed = false;

  /** Планирует следующую попытку, пока сервер работает. */
  function schedule(delayMs: number): void {
    if (closed) return;
    timer = setTimeout(() => { void attempt(); }, delayMs);
    timer.unref();
  }

  /** Проверяет индекс и повторяет попытку после временного сбоя. */
  async function attempt(): Promise<void> {
    if (closed) return;
    try {
      const result = await ensureBotMessagesTimeIndex();
      if (result === 'ready') {
        console.info('[DB] Индекс сообщений по времени готов');
        return;
      }
      console.info('[DB] Индекс сообщений строит другая реплика; повторю проверку');
    } catch (error) {
      console.error('[DB] Не удалось создать индекс сообщений; повторю попытку:', error);
    }
    schedule(RETRY_DELAY_MS);
  }

  if (server.listening) schedule(INITIAL_DELAY_MS);
  else server.once('listening', () => schedule(INITIAL_DELAY_MS));
  server.once('close', () => {
    closed = true;
    if (timer) clearTimeout(timer);
  });
}
