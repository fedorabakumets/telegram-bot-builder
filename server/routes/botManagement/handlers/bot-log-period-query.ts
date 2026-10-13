/**
 * @fileoverview Проверка границ периода и параметров постраничной загрузки логов.
 */

/** Проверенный запрос сохранённых логов. */
export interface BotLogPeriodQuery {
  /** Максимум строк одной страницы */
  limit: number;
  /** Начало диапазона включительно */
  from?: Date;
  /** Окончание диапазона исключительно */
  to?: Date;
  /** Курсор для загрузки более ранних идентификаторов */
  beforeId?: number;
}

/**
 * Проверяет целый положительный параметр запроса.
 * @param value - Исходное значение
 * @param fallback - Значение по умолчанию
 * @returns Проверенное целое число
 */
function positiveInteger(value: unknown, fallback?: number): number {
  if (value === undefined && fallback !== undefined) return fallback;
  if (typeof value !== 'string' || !/^\d+$/.test(value)) throw new Error('Ожидается положительное целое число');
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 1) throw new Error('Ожидается положительное целое число');
  return number;
}

/**
 * Проверяет абсолютное время с явным часовым поясом.
 * @param value - Параметр времени
 * @returns Дата в абсолютном времени
 */
function absoluteDate(value: unknown): Date {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/.test(value)) {
    throw new Error('Период должен содержать даты ISO с часовым поясом');
  }
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) throw new Error('Некорректная дата периода');
  return date;
}

/**
 * Разбирает параметры, сохраняя совместимость с запросом текущего запуска.
 * @param query - Параметры запроса Express
 * @returns Проверенные границы, лимит и курсор
 */
export function parseBotLogPeriodQuery(query: Record<string, unknown>): BotLogPeriodQuery {
  const limit = positiveInteger(query.limit, 500);
  if (limit > 1000) throw new Error('Максимальный лимит логов — 1000');
  if (query.from === undefined && query.to === undefined) {
    if (query.beforeId !== undefined) throw new Error('Курсор доступен только для периода');
    return { limit };
  }
  const from = absoluteDate(query.from);
  const to = absoluteDate(query.to);
  if (from >= to) throw new Error('Окончание периода должно быть позже начала');
  const beforeId = query.beforeId === undefined ? undefined : positiveInteger(query.beforeId);
  return { limit, from, to, beforeId };
}
