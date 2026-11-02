/** @fileoverview Доступный с клавиатуры список всех значений, показанных на диаграмме. */
import type { TableChartPoint } from './chart-types';

/**
 * Позволяет раскрывать значения без наведения мыши, включая длинные подписи и мобильные экраны.
 * @param props - Категории графика, текущий выбор и обработчик выбора.
 * @returns Раскрываемый список числовых значений.
 */
export function TableChartValues({ data, selected, onSelect }: {
  /** Показанные категории. */
  data: TableChartPoint[];
  /** Название выбранной категории. */
  selected?: string;
  /** Показать подробности категории. */
  onSelect: (point: TableChartPoint) => void;
}) {
  return <details className="rounded-lg border border-border p-3">
    <summary className="cursor-pointer text-sm text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Все значения на графике ({data.length})</summary>
    <div className="mt-3 grid max-h-64 gap-2 overflow-auto">
      {data.map(point => <button type="button" key={point.label} aria-pressed={selected === point.label}
        onClick={() => onSelect(point)} className="flex min-w-0 items-start justify-between gap-4 rounded-lg px-3 py-2 text-left text-sm hover:bg-muted aria-pressed:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <span className="min-w-0 break-words">{point.label || 'Без значения'}</span><span className="shrink-0 font-semibold tabular-nums">{point.value.toLocaleString('ru-RU')}</span>
      </button>)}
    </div>
  </details>;
}
