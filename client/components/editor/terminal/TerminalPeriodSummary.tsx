/**
 * @fileoverview Границы периода, состояние загрузки и навигация по страницам истории.
 */
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { formatLogPeriodRange } from './terminal-log-period';
import type { useTerminalPeriod } from './use-terminal-period';

/**
 * Показывает фиксированный диапазон и позволяет запросить более ранние строки.
 * @param props - Состояние загрузки истории
 * @returns Полоса периода или отсутствие полосы в режиме текущего запуска
 */
export function TerminalPeriodSummary({ state }: {
  /** Состояние периода и загруженных страниц */
  state: ReturnType<typeof useTerminalPeriod>;
}) {
  if (!state.range) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-1.5 text-xs font-sans" role="status">
      <span className="text-muted-foreground">{formatLogPeriodRange(state.range)}</span>
      <span className={state.error ? 'text-destructive' : 'text-muted-foreground'}>
        {state.error ? 'Не удалось загрузить логи' : state.isLoading ? 'Загрузка…' : `${state.lines.length} строк`}
      </span>
      <span className="flex-1" />
      {state.hasMore && <Button variant="ghost" size="sm" className="h-7 text-xs" disabled={state.loadingMore}
        onClick={state.loadMore}>{state.loadingMore ? 'Загрузка…' : 'Загрузить более ранние'}</Button>}
      <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Обновить период" onClick={state.refresh}>
        <RefreshCw className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
