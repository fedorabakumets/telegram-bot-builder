/** @fileoverview Видимый период рядом с графиком, независимый от наличия точек и положения общих фильтров. */
/**
 * Показывает фактические границы снимка и его часовой пояс.
 * @param props - Общий диапазон отчёта и пояс подписей.
 * @returns Строка периода либо отсутствие подписи до загрузки диапазона.
 */
export function AnalyticsReportPeriod({ range, timezone }: {
  /** Границы полученного снимка, а не крайние непустые точки. */ range?: { /** Начало. */ from: string; /** Конец. */ to: string };
  /** Пояс графика. */ timezone: string;
}) {
  if (!range) return null;
  /** Форматирует момент в выбранном поясе до минуты. */
  const format = (date: string) => new Date(date).toLocaleString('ru-RU', { timeZone: timezone,
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  return <p className="text-xs leading-5 text-muted-foreground" aria-label="Период графика">
    Период: <time dateTime={range.from}>{format(range.from)}</time> — <time dateTime={range.to}>{format(range.to)}</time> · {timezone}
  </p>;
}
