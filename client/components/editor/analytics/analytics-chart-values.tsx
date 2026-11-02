/** @fileoverview Компактные строки значений графика с общей шапкой и точными границами по выбору. */
import type { ReportChartPoint, ReportSeries } from './analytics-report-chart';
import './analytics-chart-values.css';
/** Свойства списка значений. */
interface Props {
  /** Точки с учётом режима накопления. */ rows: ReportChartPoint[];
  /** Числовые ряды. */ series: ReportSeries[];
  /** Часовой пояс дат. */ timezone: string;
  /** Шаг графика. */ stepMs: number;
  /** Выбранная дата. */ selected: string | null;
  /** Закрепляет интервал. */ onSelect: (date: string) => void;
  /** Возвращает фактические границы интервала. */ bounds: (date: string) => { /** Начало. */ from: string; /** Конец. */ to: string };
  /** Полная подпись для доступности и подсказки. */ formatFull: (date: string) => string;
}
/** Форматирует дату без повторов дня недели и часового пояса. @param from - Начало. @param to - Конец. @param timezone - Часовой пояс. @param stepMs - Шаг. @returns Краткая подпись. */
export function compactChartInterval(from: string, to: string, timezone: string, stepMs: number): string {
  const start = new Date(from), end = new Date(Math.max(Date.parse(from), Date.parse(to) - 1));
  const dayKey = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' });
  const year = new Intl.DateTimeFormat('ru-RU', { timeZone: timezone, year: 'numeric' });
  const date = (value: Date) => value.toLocaleDateString('ru-RU', { timeZone: timezone, day: 'numeric', month: 'short', ...(year.format(start) !== year.format(end) ? { year: 'numeric' as const } : {}) });
  if (stepMs >= 86400000) return dayKey.format(start) === dayKey.format(end) ? date(start) : `${date(start)} — ${date(end)}`;
  const time = (value: Date) => value.toLocaleTimeString('ru-RU', { timeZone: timezone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  const finish = new Date(to);
  return dayKey.format(start) === dayKey.format(finish) ? `${date(start)}, ${time(start)}–${time(finish)}` : `${date(start)}, ${time(start)} — ${date(finish)}, ${time(finish)}`;
}
/** Показывает названия рядов один раз, а значения — в устойчивых числовых колонках. @param props - Точки, формат и выбор. @returns Раскрываемый список. */
export function AnalyticsChartValues({ rows, series, timezone, stepMs, selected, onSelect, bounds, formatFull }: Props) {
  const gridTemplateColumns = `minmax(120px, 1.5fr) repeat(${series.length}, minmax(72px, 1fr))`;
  return <details className="analytics-chart-values"><summary className="text-sm text-muted-foreground cursor-pointer py-2">Все значения графика</summary>
    <div className="analytics-chart-value-list" role="list"><div className="analytics-chart-values-grid" style={{ minWidth: 144 + series.length * 88 }}>
      <div className="analytics-chart-values-header" style={{ gridTemplateColumns }}><span>Дата</span>{series.map(item => <span key={item.key}>{item.label}</span>)}</div>
      {rows.map(row => { const interval = bounds(row.date); return <button key={row.date} type="button" style={{ gridTemplateColumns }} title={formatFull(row.date)} aria-label={`${formatFull(row.date)} · ${series.map(item => `${item.label}: ${Number(row[item.key] ?? 0).toLocaleString('ru-RU')}`).join(' · ')}`} aria-pressed={selected === row.date} onClick={() => onSelect(row.date)}>
        <span>{compactChartInterval(interval.from, interval.to, timezone, stepMs)}</span>{series.map(item => <span key={item.key}>{Number(row[item.key] ?? 0).toLocaleString('ru-RU')}</span>)}
      </button>; })}
    </div></div>
  </details>;
}
