/** @fileoverview Ограниченная очередь попыток пакетного перезапуска без собственных пауз допуска. */

/**
 * Выполняет до пяти операций одновременно, сохраняя общий допуск внутри startBot.
 * @param items - Только успешно остановленные боты.
 * @param run - Операция, самостоятельно фиксирующая частичный исход.
 * @returns Завершение всех операций пакета.
 */
export async function restartStartPool<T>(items: readonly T[], run: (item: T) => Promise<void>): Promise<void> {
  let next = 0;
  /** Берёт очередную запись после завершения своей предыдущей попытки. */
  const worker = async () => {
    while (next < items.length) {
      const item = items[next++];
      await run(item);
    }
  };
  await Promise.all(Array.from({ length: Math.min(5, items.length) }, worker));
}
