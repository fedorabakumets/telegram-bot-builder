/** @fileoverview Увеличение и независимое обновление графика пользовательской таблицы. */
import { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { AnalyticsChartActions, AnalyticsSnapshotRefreshContext } from '../analytics-chart-actions';
import { TableChartRender, type TableChartRenderProps } from './table-chart-render';

/** Параметры отображения и отдельного запроса графика. */
interface Props extends TableChartRenderProps {
  /** Обновляет данные выбранной таблицы. */ refresh: () => Promise<unknown>;
  /** Выполняется ли запрос. */ busy: boolean;
}
/** Сохраняет выбор категории при переносе графика в увеличенное окно. @param props - Данные и действия графика. @returns График с кнопками. */
export function TableChartExpansion({ refresh, busy, ...props }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState('');
  const trigger = useRef<HTMLButtonElement>(null);
  /** Запрашивает график повторно, сохраняя прежние значения при ошибке. @returns Завершение запроса. */
  async function reload() {
    if (busy) return;
    setError('');
    try { await refresh(); } catch { setError('Не удалось обновить график. Попробуйте ещё раз.'); }
  }
  const chart = <TableChartRender {...props} expanded={expanded} selectedLabel={selected} onSelectedLabelChange={setSelected} />;
  return <AnalyticsSnapshotRefreshContext.Provider value={{ refresh: () => void reload(), busy, error, label: 'Обновить график таблицы' }}>
    <AnalyticsChartActions title="График по таблице" open={() => setExpanded(true)} triggerRef={trigger} />
    {!expanded && chart}<Dialog open={expanded} onOpenChange={setExpanded}><DialogContent hideClose aria-describedby={undefined}
      onCloseAutoFocus={event => { event.preventDefault(); trigger.current?.focus(); }} className="analytics-chart-dialog w-[calc(100%-1rem)] max-w-none sm:max-w-[min(1100px,96vw)] max-h-[94dvh] overflow-y-auto">
      <div className="flex flex-wrap items-center justify-between gap-3"><DialogTitle>График по таблице</DialogTitle><div className="flex items-center gap-2">
        <AnalyticsChartActions expanded open={() => setExpanded(true)} triggerRef={trigger} />
        <button type="button" onClick={() => setExpanded(false)} className="rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring">Закрыть график</button></div></div>{chart}</DialogContent></Dialog>
  </AnalyticsSnapshotRefreshContext.Provider>;
}
