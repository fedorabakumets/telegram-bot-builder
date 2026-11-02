/** @fileoverview Общий период отчёта и перевод календарных границ в часовой пояс проекта. */
export const REPORT_PERIODS = { '1h': '1 час', '3h': '3 часа', '24h': '24 часа', '7d': '7 дней', '30d': '30 дней', '12w': '12 недель', '12m': '12 месяцев', all: 'Всё время', custom: 'Даты' } as const;
/** Допустимые размеры интервала графика в миллисекундах. */
const REPORT_STEPS: Record<string, number> = { '1m': 60000, '5m': 300000, '1h': 3600000, '1d': 86400000, '7d': 604800000, '30d': 2592000000 };
/** Общие фильтры всех отчётов вкладки. */
export interface AnalyticsReportFilter {
  /** Готовый период или календарный диапазон. */
  period: keyof typeof REPORT_PERIODS;
  /** Первый календарный день. */
  from: string;
  /** Последний календарный день включительно. */
  to: string;
  /** Часовой пояс календарных границ. */
  timezone: string;
  /** Сравнивать с предыдущим равным окном. */
  compare: boolean;
  /** Детализация ряда независимо от выбранного периода. */
  step?: 'auto' | '1m' | '5m' | '1h' | '1d' | '7d' | '30d';
}
/** Возвращает календарную дату. @param date - Момент времени. @param timezone - Пояс отчёта. @returns Дата YYYY-MM-DD. */
export function reportDay(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}
/** Переводит полночь в UTC. @param day - Календарный день. @param timezone - Пояс отчёта. @returns Граница в ISO UTC. */
export function reportMidnight(day: string, timezone: string): string {
  const target = Date.parse(`${day}T00:00:00Z`);
  let guess = target;
  for (let attempt = 0; attempt < 3; attempt++) {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(guess));
    const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
    const displayed = Date.parse(`${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}:${values.second}Z`);
    guess += target - displayed;
  }
  return new Date(guess).toISOString();
}
/** Сдвигает календарный день без влияния летнего времени. @param day - Исходный день. @param offset - Число дней, по умолчанию следующий. @returns Сдвинутый календарный день. */
export function nextReportDay(day: string, offset = 1): string {
  return new Date(Date.parse(`${day}T00:00:00Z`) + offset * 86400000).toISOString().slice(0, 10);
}
/** Собирает параметры запроса. @param filter - Общие фильтры. @param tokenId - Выбранный бот. @returns Проверенные параметры API. */
export function reportParams(filter: AnalyticsReportFilter, tokenId?: number | null): URLSearchParams {
  const params = new URLSearchParams({ timezone: filter.timezone });
  if (tokenId != null) params.set('tokenId', String(tokenId));
  if (filter.period === 'custom') {
    if (!filter.from || !filter.to || filter.to < filter.from) throw new Error('Дата окончания должна быть не раньше начала.');
    params.set('from', reportMidnight(filter.from, filter.timezone));
    params.set('to', new Date(Math.min(Date.now(), Date.parse(reportMidnight(nextReportDay(filter.to), filter.timezone)))).toISOString());
    if (Date.parse(params.get('from')!) >= Date.parse(params.get('to')!)) throw new Error('Выберите период, который уже начался.');
  } else params.set('period', filter.period);
  if (filter.compare && filter.period !== 'all') params.set('comparison', 'previous');
  if (filter.step && filter.step !== 'auto') params.set('step', filter.step);
  return params;
}
/**
 * Ограничивает варианты детализации 500 точками, сохраняя доступным автоматический шаг.
 * @param filter - Общий период отчёта.
 * @param step - Кандидат шага.
 * @returns Можно ли выбрать этот шаг без ошибки лимита.
 */
export function reportStepAvailable(filter: AnalyticsReportFilter, step: string): boolean {
  if (filter.period === 'all') return false;
  const windows: Record<string, number> = { '1h': 3600000, '3h': 10800000, '24h': 86400000, '7d': 604800000, '30d': 2592000000, '12w': 7257600000, '12m': 31536000000 };
  try {
    const duration = filter.period === 'custom' ? Date.parse(reportMidnight(nextReportDay(filter.to), filter.timezone)) - Date.parse(reportMidnight(filter.from, filter.timezone)) : windows[filter.period];
    return Math.ceil(duration / REPORT_STEPS[step]) <= 500;
  } catch { return false; }
}
/** Восстанавливает настройки отчёта. @param projectId - Проект. @returns Сохранённые либо начальные фильтры. */
export function initialReportFilter(projectId: number): AnalyticsReportFilter {
  let timezone = 'Europe/Moscow';
  try { timezone = localStorage.getItem(`analytics:timezone:${projectId}`) || timezone; new Intl.DateTimeFormat('ru', { timeZone: timezone }); }
  catch { timezone = 'Europe/Moscow'; }
  try {
    const saved = JSON.parse(sessionStorage.getItem(`analytics:report:${projectId}`) || 'null') as AnalyticsReportFilter | null;
    if (saved && saved.period in REPORT_PERIODS && typeof saved.from === 'string' && typeof saved.to === 'string' && typeof saved.compare === 'boolean') return { ...saved, timezone };
  } catch { /* Повреждённые настройки заменяются значениями по умолчанию. */ }
  const now = new Date();
  return { period: '30d', from: nextReportDay(reportDay(now, timezone), -29), to: reportDay(now, timezone), timezone, compare: true, step: 'auto' };
}
/** Подписывает точный момент отчёта. @param date - Момент UTC. @param timezone - Календарный пояс. @returns Читаемые дата и время до секунды. */
export function reportTimeLabel(date: string, timezone: string): string {
  return new Date(date).toLocaleString('ru-RU', { timeZone: timezone, year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
/** Подписывает период карточки и закреплённых подробностей. @param range - Границы и пояс снимка. @returns Полный диапазон без служебных оговорок в заголовке. */
export function reportRangeLabel(range: { /** Начало. */ from: string; /** Конец. */ to: string; /** Пояс. */ timezone: string }): string {
  return `${reportTimeLabel(range.from, range.timezone)} — ${reportTimeLabel(range.to, range.timezone)} · ${range.timezone}`;
}
