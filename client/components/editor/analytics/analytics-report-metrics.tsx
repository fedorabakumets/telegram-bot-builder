/** @fileoverview Общие числовые сводки и сравнение достоверных аналитических показателей. */
/** Показывает изменение без ложного процента от нуля. @param props - Текущий и предыдущий итоги. @returns Подпись сравнения либо отсутствие сравнения. */
export function AnalyticsReportComparison({ current, previous, approximate }: { /** Текущее значение. */ current: number; /** Предыдущее значение. */ previous?: number; /** Сравнение содержит записи с неточной датой первого взаимодействия. */ approximate?: boolean }) {
  if (previous == null) return null;
  const delta = current - previous;
  return <span className="text-xs text-muted-foreground">{delta > 0 ? '+' : ''}{delta.toLocaleString('ru-RU')}{previous > 0 ? ` (${delta > 0 ? '+' : ''}${(delta / previous * 100).toLocaleString('ru-RU', { maximumFractionDigits: 1 })}%)` : ''} к предыдущему периоду{approximate ? ' · по сохранённым данным' : ''}</span>;
}
/** Показывает выровненные подписи и значения; пара показателей занимает две равные колонки. @param props - Подписанные числовые показатели. @returns Сетка определений и значений. */
export function AnalyticsReportSummary({ items }: { /** Подписанные значения. */ items: Array<[string, number]> }) {
  return <dl className="analytics-report-summary" style={items.length === 2 ? { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' } : undefined}>{items.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value.toLocaleString('ru-RU')}</dd></div>)}</dl>;
}
