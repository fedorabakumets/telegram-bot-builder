/** @fileoverview Результаты и защита от одновременного редактирования рассылки. */
/** Итоги подтверждённых и неподтверждённых правок. */
export interface BroadcastEditStats {
  /** Количество запросов Telegram. */
  attempted: number;
  /** Telegram подтвердил изменение. */
  edited: number;
  /** Telegram подтвердил совпадение содержимого. */
  unchanged: number;
  /** Telegram отказал или отсутствует токен. */
  failed: number;
  /** Ответ Telegram или сохранение не подтверждены. */
  unknown: number;
  /** У отправленных сообщений отсутствует адрес Telegram. */
  skipped: number;
  /** Подтверждённые Telegram правки, не сохранённые полностью в истории. */
  persistenceFailed: number;
}
/** Занятые рассылки текущего процесса. */
const editing = new Set<number>();
/** Ошибка конфликта с отправкой или другой правкой. */
export class BroadcastEditConflict extends Error {}
/**
 * Захватывает правку до завершения внешних запросов в текущем процессе.
 * @param id - ID рассылки; отрицательное значение обозначает кампанию.
 * @returns Функция освобождения блокировки.
 */
export function acquireBroadcastEdit(id: number): () => void {
  if (editing.has(id)) throw new BroadcastEditConflict("Рассылка уже редактируется");
  editing.add(id);
  return () => { editing.delete(id); };
}
/** Создаёт пустые счётчики результата. @returns Начальное состояние правки. */
export function emptyBroadcastEditStats(): BroadcastEditStats {
  return { attempted: 0, edited: 0, unchanged: 0, failed: 0, unknown: 0, skipped: 0, persistenceFailed: 0 };
}
/**
 * Возвращает совместимый ответ API с явным частичным исходом.
 * @param stats - Счётчики Telegram и сохранения истории.
 * @returns Ответ без объявления частичной операции полностью успешной.
 */
export function broadcastEditResponse(stats: BroadcastEditStats) {
  const confirmed = stats.edited + stats.unchanged;
  const complete = stats.failed + stats.unknown + stats.skipped + stats.persistenceFailed === 0 && confirmed > 0;
  return { ok: complete, outcome: complete ? "success" : confirmed > 0 ? "partial" : "failed", ...stats,
    persistence: { confirmed: complete, failed: stats.persistenceFailed } };
}
