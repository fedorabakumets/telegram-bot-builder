/** @fileoverview Действия увеличения графика и обновления общего снимка аналитики. */
import { createContext, useContext, type RefObject } from 'react';
import { Maximize2, RefreshCw } from 'lucide-react';

/** Общее обновление согласованного снимка графиков. */
export interface AnalyticsSnapshotRefresh {
  /** Запросить новый снимок. */ refresh: () => void;
  /** Выполняется ли обновление. */ busy: boolean;
  /** Сообщение об ошибке с возможностью повтора. */ error: string;
  /** Название действия для отдельного источника данных. */ label?: string;
}
/** Доступ к обновлению из карточек одного снимка. */
export const AnalyticsSnapshotRefreshContext = createContext<AnalyticsSnapshotRefresh | null>(null);

/** Показывает компактные кнопки действий графика. @param props - Состояние и открытие графика. @returns Кнопки и ошибка обновления. */
export function AnalyticsChartActions({ open, triggerRef, expanded = false, title }: { /** Открывает увеличенный график. */ open: () => void; /** Возврат фокуса. */ triggerRef: RefObject<HTMLButtonElement>; /** График открыт в окне. */ expanded?: boolean; /** Название карточки графика. */ title?: string }) {
  const refresh = useContext(AnalyticsSnapshotRefreshContext);
  return <div className={`analytics-chart-actions flex flex-wrap items-center justify-end gap-2 ${expanded ? 'is-expanded' : ''}`} data-analytics-chart-control>
    {refresh && <button type="button" aria-label={refresh.label ?? 'Обновить данные аналитики'} title={refresh.label ?? 'Обновить данные аналитики'} disabled={refresh.busy}
      onClick={refresh.refresh} className="inline-flex h-9 w-9 items-center justify-center rounded-md border text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${refresh.busy ? 'animate-spin motion-reduce:animate-none' : ''}`} aria-hidden="true" /></button>}
    {!expanded && <button ref={triggerRef} type="button" aria-label={title ? `Развернуть график: ${title}` : 'Развернуть график'} title={title ? `Развернуть график: ${title}` : 'Развернуть график'} onClick={open}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md border text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"><Maximize2 className="h-4 w-4" aria-hidden="true" /></button>}
    {refresh?.error && <span role="alert" className="basis-full text-xs text-destructive">{refresh.error}</span>}
  </div>;
}
