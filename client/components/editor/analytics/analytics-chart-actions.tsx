/** @fileoverview Действия увеличения графика и обновления общего снимка аналитики. */
import { createContext, useContext, type RefObject } from 'react';
import { RefreshCw } from 'lucide-react';

/** Общее обновление согласованного снимка графиков. */
export interface AnalyticsSnapshotRefresh {
  /** Запросить новый снимок. */ refresh: () => void;
  /** Выполняется ли обновление. */ busy: boolean;
  /** Сообщение об ошибке с возможностью повтора. */ error: string;
  /** Название действия для отдельного источника данных. */ label?: string;
}
/** Доступ к обновлению из карточек одного снимка. */
export const AnalyticsSnapshotRefreshContext = createContext<AnalyticsSnapshotRefresh | null>(null);

/** Показывает отдельное обновление таблицы без плавающей кнопки периода. @param props - Состояние и открытие графика. @returns Кнопки и ошибка отдельного обновления. */
export function AnalyticsChartActions({ expanded = false }: { /** Открывает увеличенный график. */ open: () => void; /** Возврат фокуса. */ triggerRef: RefObject<HTMLButtonElement>; /** График открыт в окне. */ expanded?: boolean; /** Название карточки графика. */ title?: string }) {
  const refresh = useContext(AnalyticsSnapshotRefreshContext);
  /** Общий снимок обновляется из шапки вкладки, без повторной кнопки в каждой карточке. */
  const showRefresh = !!refresh && (!!refresh.label || expanded);
  if (!showRefresh) return null;
  return <div className={`analytics-chart-actions flex flex-wrap items-center justify-end gap-2 ${expanded ? 'is-expanded' : ''}`} data-analytics-chart-control>
    {showRefresh && refresh && <button type="button" aria-label={refresh.label ?? 'Обновить данные аналитики'} title={refresh.label ?? 'Обновить данные аналитики'} disabled={refresh.busy}
      onClick={refresh.refresh} className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${refresh.busy ? 'animate-spin motion-reduce:animate-none' : ''}`} aria-hidden="true" /></button>}
    {showRefresh && refresh?.error && <span role="alert" className="basis-full text-xs text-destructive">{refresh.error}</span>}
  </div>;
}
