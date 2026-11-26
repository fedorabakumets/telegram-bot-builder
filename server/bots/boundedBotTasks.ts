/** @fileoverview Ограниченный обход очереди ботов без обещания на каждого кандидата. */

/**
 * Обрабатывает группу пятью работниками без создания обещания на каждого бота.
 * @param instances - Кандидаты в исходном порядке.
 * @param restore - Одна попытка восстановления с собственными повторами.
 * @returns Результаты в исходном порядке независимо от времени завершения.
 */
export async function mapRestoreCandidates<T, R>(
  instances: T[], restore: (instance: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(instances.length);
  let next = 0;
  /** Каждый работник получает следующий элемент только после завершения предыдущего. */
  async function worker(): Promise<void> {
    while (next < instances.length) {
      const index = next++;
      results[index] = await restore(instances[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(5, instances.length) }, () => worker()));
  return results;
}
