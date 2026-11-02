/** @fileoverview Единая аналитика подтверждённых взаимодействий, источников и рекламных расходов. */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useProjectTokens } from '@/hooks/use-project-tokens';
import { useNormalizeSelectedTokenId } from '@/hooks/use-normalize-selected-token';
import { useAnalyticsPeriodPosition } from './use-analytics-period-position';
import { useAnalyticsScrollPosition } from './use-analytics-scroll-position';
import { AnalyticsHeader } from './analytics-header';
import { AnalyticsChartState } from './analytics-chart-state';
import { AnalyticsCollapsibleSection } from './analytics-collapsible-section';
import { AnalyticsHeaderPeriod } from './analytics-header-period';
import { AnalyticsReportStatus } from './analytics-report-status';
import {AnalyticsOpenPeriodContext} from './analytics-choose-period';
import {AnalyticsChartRangeContext,chartRangeFilter} from './analytics-chart-range-selection';
import { AnalyticsReportContent } from './analytics-report-content';
import { AnalyticsAcquisitionSection } from './analytics-acquisition-section';
import { AnalyticsTableChartCard } from './table-chart/analytics-table-chart-card';
import { useAnalyticsSnapshot } from './use-analytics-snapshot';
import { AnalyticsSnapshotRefreshContext } from './analytics-chart-actions';
import { initialReportFilter, type AnalyticsReportFilter } from './analytics-report-filter';
import './analytics-panel.css';
import './analytics-dashboard.css';
import './analytics-report.css';
/** Контрастные состояния нативных флажков внутри рабочей вкладки. */
import './analytics-checkbox.css';

/** Контекст рабочей вкладки аналитики. */
export interface AnalyticsPanelProps {
  /** Проект. */ projectId: number;
  /** Выбранный бот или весь проект. */ selectedTokenId?: number | null;
  /** Смена бота. */ onSelectToken?: (tokenId: number | null) => void;
  /** Проекты пользователя. */ allProjects?: Array<{ /** ID проекта. */ id: number; /** Название. */ name: string }>;
  /** Смена проекта. */ onProjectChange?: (projectId: number) => void;
}
/**
 * Сохраняет фильтры и формы; отсутствие истории объясняет без требования ручного переноса.
 * @param props - Контекст проекта, бота и навигации.
 * @returns Рабочая вкладка аналитики.
 */
export function AnalyticsPanel({ projectId, selectedTokenId, onSelectToken, allProjects, onProjectChange }: AnalyticsPanelProps) {
  const [periodRequest,setPeriodRequest]=useState(0);
  const [filter, setFilter] = useState(() => initialReportFilter(projectId));
  const [refreshError, setRefreshError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [snapshotError, setSnapshotError] = useState('');
  const client = useQueryClient();
  const tokens = useProjectTokens([projectId])[0]?.tokens ?? [];
  const snapshot = useAnalyticsSnapshot(projectId, selectedTokenId, filter);
  /** Отличает смену периода от обычного фонового обновления по событиям. */
  const periodKey = JSON.stringify(filter);
  const previousPeriodKey = useRef(periodKey);
  const changingPeriod = useRef(false);
  if (previousPeriodKey.current !== periodKey) { previousPeriodKey.current = periodKey; changingPeriod.current = true; }
  if (!snapshot.isFetching) changingPeriod.current = false;
  const resetDeletedToken = useCallback(() => onSelectToken?.(null), [onSelectToken]);
  useNormalizeSelectedTokenId(tokens, selectedTokenId, resetDeletedToken);
  useEffect(() => { setFilter(initialReportFilter(projectId)); }, [projectId]);
  /** Сохраняет настройки. @param value - Новые фильтры. @returns Ничего; обновляет локальное состояние. */
  function changeFilter(value: AnalyticsReportFilter) {
    periodPosition.preserve();
    setFilter(value);
    try { localStorage.setItem(`analytics:timezone:${projectId}`, value.timezone); sessionStorage.setItem(`analytics:report:${projectId}`, JSON.stringify(value)); } catch { /* Ограничение хранилища не мешает использованию отчёта. */ }
  }
  /** Обновляет активные отчёты, сохраняя выбор и прокрутку. @returns Завершение обновления. */
  async function refresh() {
    if (refreshing) return;
    setRefreshing(true); setRefreshError('');
    try { await client.refetchQueries({ type: 'active', predicate: query => ['analytics-v2', 'analytics-acquisition', 'bot-table-chart', 'chat-access-check'].includes(String(query.queryKey[0])) && query.queryKey[1] === projectId }, { throwOnError: true }); }
    catch { setRefreshError('Не удалось обновить часть отчётов. Проверьте соединение и повторите загрузку.'); }
    finally { setRefreshing(false); }
  }
  /** Обновляет только общий снимок аналитики, сохраняя существующие графики при ошибке. @returns Завершение запроса. */
  async function refreshSnapshot() {
    if (snapshot.isFetching) return;
    setSnapshotError('');
    try { await snapshot.refetch({ throwOnError: true }); }
    catch { setSnapshotError('Не удалось обновить данные. Попробуйте ещё раз.'); }
  }
  const scrollRoot = useAnalyticsScrollPosition(projectId, selectedTokenId);
  const periodPosition = useAnalyticsPeriodPosition(scrollRoot, snapshot.isPlaceholderData ? undefined : snapshot.data, snapshot.isError);
  const data = snapshot.data;
  return <div className="analytics-page @container flex min-h-0 min-w-0 flex-col h-full bg-background">
    <AnalyticsHeader periodRequest={periodRequest} periodControl={<AnalyticsHeaderPeriod openRequest={periodRequest} filter={filter} range={!snapshot.isError && !snapshot.isPlaceholderData ? data?.range : undefined} onChange={changeFilter} />} audienceCounts={new Map(!snapshot.isError && data?.project_id === projectId ? data.token_audiences?.map(item => [item.token_id, item.total_users] as const) ?? [] : [])} totalUsers={!snapshot.isError && data?.project_id === projectId && data?.token_id === selectedTokenId ? data.current.audience.total_users : undefined} projectId={projectId} tokens={tokens} selectedTokenId={selectedTokenId} onSelectToken={onSelectToken} allProjects={allProjects} onProjectChange={onProjectChange} isRefreshing={refreshing || (!data && snapshot.isFetching)} onRefresh={() => void refresh()} />
    <AnalyticsOpenPeriodContext.Provider value={()=>setPeriodRequest(value=>value+1)}><ScrollArea ref={scrollRoot} className="min-h-0 flex-1"><div ref={periodPosition.content} className="analytics-content workspace-tab-frame flex flex-col gap-4">
      <AnalyticsReportStatus snapshot={data} fetching={snapshot.isFetching} previousPeriod={snapshot.isPlaceholderData} connection={snapshot.connection} bridgeConnected={snapshot.bridgeConnected} />
      {refreshError && <div role="alert" className="analytics-refresh-error"><p>{refreshError}</p><button type="button" onClick={() => void refresh()}>Повторить</button></div>}
      {snapshot.isError && !data ? <AnalyticsChartState title="Не удалось загрузить аналитику" description={snapshot.error.message} onRetry={() => void snapshot.refetch()} />
        : !data ? <AnalyticsChartState loading />
        : data.coverage.status === 'unavailable' ? <AnalyticsChartState title="Пока нет данных для графиков" description="Сохранённая история переносится автоматически при запуске конструктора. Если переписки ещё не было, статистика появится после начала использования бота." />
        : <div aria-busy={snapshot.isFetching && changingPeriod.current} ref={node => { if (node) node.inert = snapshot.isPlaceholderData; }} className={`flex flex-col gap-4 ${snapshot.isFetching && changingPeriod.current ? 'analytics-period-updating' : ''}`}><AnalyticsSnapshotRefreshContext.Provider value={{ refresh: () => void refreshSnapshot(), busy: snapshot.isFetching, error: snapshotError }}><AnalyticsChartRangeContext.Provider value={range=>changeFilter(chartRangeFilter(filter,range))}><AnalyticsReportContent snapshot={data} /></AnalyticsChartRangeContext.Provider></AnalyticsSnapshotRefreshContext.Provider></div>}
      <AnalyticsAcquisitionSection key={`acquisition:${projectId}`} projectId={projectId} tokenId={selectedTokenId} tokens={tokens} timezone={filter.timezone} snapshot={snapshot.isError ? undefined : data} />
      <AnalyticsCollapsibleSection title="Данные проекта" description="Текущие данные таблицы. Общий период применяется только при выборе колонки даты.">
      <AnalyticsTableChartCard key={`table-chart:${projectId}`} projectId={projectId} range={snapshot.isError ? undefined : data?.range} />
      </AnalyticsCollapsibleSection>
    </div></ScrollArea></AnalyticsOpenPeriodContext.Provider>
  </div>;
}
