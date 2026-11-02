/** @fileoverview Раскрываемая карточка выбранного значения диаграммы. */
import type { TableChartPoint } from './chart-types';

/**
 * Показывает полное название категории и точное значение после нажатия на диаграмму.
 * @param props - Выбранная группа, подписи полей и обработчик закрытия.
 * @returns Карточка подробностей с доступной кнопкой закрытия.
 */
export function TableChartDetails({ point, categoryLabel, valueLabel, onClose }: {
  /** Выбранная категория и её значение. */
  point: TableChartPoint;
  /** Название столбца группировки. */
  categoryLabel: string;
  /** Название рассчитанного показателя. */
  valueLabel: string;
  /** Скрыть подробности. */
  onClose: () => void;
}) {
  return <section aria-label="Подробности выбранного значения" aria-live="polite"
    className="space-y-4 rounded-xl border border-border bg-background p-4">
    <div className="flex items-center justify-between gap-3">
      <h5 className="text-sm font-semibold">Выбранное значение</h5>
      <button type="button" onClick={onClose} className="rounded-lg px-3 py-2 text-xs text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Закрыть</button>
    </div>
    <dl className="grid gap-4 sm:grid-cols-2">
      <div className="min-w-0 space-y-2"><dt className="text-xs text-muted-foreground">{categoryLabel}</dt><dd className="break-words text-sm font-medium">{point.label || 'Без значения'}</dd></div>
      <div className="space-y-2"><dt className="text-xs text-muted-foreground">{valueLabel}</dt><dd className="text-2xl font-semibold tabular-nums">{point.value.toLocaleString('ru-RU')}</dd></div>
    </dl>
  </section>;
}
