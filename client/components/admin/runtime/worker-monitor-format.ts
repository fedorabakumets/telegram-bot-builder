/** @fileoverview Форматирование достоверных показателей воркеров без подмены неизвестного нулём. */
/** Возвращает память в двоичных мегабайтах или явное отсутствие замера. */
export function workerMemory(value: number | null | undefined): string {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? `${value.toLocaleString('ru-RU', { maximumFractionDigits: 1 })} МиБ` : 'Нет замера';
}
/** Форматирует время отдельного этапа, сохраняя нулевой результат. */
export function workerDuration(value: number | null | undefined): string {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? `${(value / 1000).toLocaleString('ru-RU', { maximumFractionDigits: 2 })} с` : 'Нет замера';
}
/** Даёт понятное название реально применённой группировке. */
export function workerGrouping(value: string | null | undefined): string {
  return ({ project: 'По проектам', owner: 'По владельцам', shared: 'Общий пул', mixed: 'Смешанная' } as Record<string, string>)[value ?? ''] ?? value ?? 'Нет активных ботов';
}
