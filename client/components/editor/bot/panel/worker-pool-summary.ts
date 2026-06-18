/**
 * @fileoverview Форматирование краткой сводки Worker Pool для мобильного бейджа
 * @module bot/panel/worker-pool-summary
 */

/** Минимальные данные для мобильной сводки */
export interface WorkerPoolSummaryData {
  /** Количество воркеров */
  workers: number;
  /** Общее число ботов */
  totalBots: number;
  /** Память в МБ */
  totalMemoryMb: number;
}

/**
 * Склоняет русское существительное по числу
 * @param n - Число
 * @param one - Форма для 1, 21, …
 * @param few - Форма для 2–4, 22–24, …
 * @param many - Форма для 0, 5–20, 25–30, …
 * @returns Подходящая форма слова
 */
function pluralRu(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return many;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}

/**
 * Формирует читаемую однострочную сводку для мобильного бейджа.
 * При 1 воркере и 1 боте воркеры опускаются — остаётся «1 бот · 10 MB».
 * @param data - Статистика Worker Pool
 * @returns Строка сводки
 */
export function formatMobileWorkerPoolSummary(data: WorkerPoolSummaryData): string {
  const parts: string[] = [];
  const showWorkers = data.workers > 1 || (data.workers === 1 && data.totalBots !== 1);

  if (showWorkers) {
    parts.push(`${data.workers} ${pluralRu(data.workers, 'воркер', 'воркера', 'воркеров')}`);
  }

  parts.push(`${data.totalBots} ${pluralRu(data.totalBots, 'бот', 'бота', 'ботов')}`);

  if (data.totalMemoryMb > 0) {
    parts.push(`${data.totalMemoryMb} MB`);
  }

  return parts.join(' · ');
}
