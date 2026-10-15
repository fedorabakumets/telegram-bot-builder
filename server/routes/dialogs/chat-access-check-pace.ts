/**
 * @fileoverview Параллельная проверка чатов с ограничением частоты стартов.
 * @module server/routes/dialogs/chat-access-check-pace
 */

/** Не чаще 25 новых запросов в секунду. */
const START_GAP_MS = 40;
/** Сколько запросов к Telegram может идти одновременно. */
const CONCURRENCY = 8;

/**
 * Ждёт свою очередь старта, не сдвигая чужие слоты.
 * @param slot - Момент, когда этому вызову можно стартовать
 * @returns Завершение ожидания
 */
function sleepUntil(slot: number): Promise<void> {
  const wait = slot - Date.now();
  if (wait <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, wait));
}

/**
 * Обходит чаты несколькими потоками. Новый запрос начинается не чаще чем раз в 40 мс.
 * Уже начатые запросы после остановки доходят до конца.
 * @param items - Идентификаторы чатов
 * @param runOne - Проверка одного чата
 * @param shouldStop - Пора не начинать новые
 * @returns Когда все начатые проверки закончились
 */
export async function runWithChatAccessPace(
  items: readonly string[],
  runOne: (chatId: string) => Promise<void>,
  shouldStop: () => boolean,
): Promise<void> {
  let cursor = 0;
  let nextStart = 0;

  /**
   * Берёт следующий чат и ждёт свободный слот старта.
   * @returns Завершение потока
   */
  async function worker(): Promise<void> {
    for (;;) {
      if (shouldStop()) return;
      const index = cursor;
      cursor += 1;
      if (index >= items.length) return;
      const slot = Math.max(Date.now(), nextStart);
      nextStart = slot + START_GAP_MS;
      await sleepUntil(slot);
      if (shouldStop()) return;
      await runOne(items[index]);
    }
  }

  const workers = Math.min(CONCURRENCY, items.length);
  await Promise.all(Array.from({ length: workers }, () => worker()));
}
