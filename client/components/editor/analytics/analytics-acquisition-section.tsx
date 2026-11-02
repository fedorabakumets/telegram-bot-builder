/** @fileoverview Источники, конструктор ссылок и рекламный бюджет в единой рабочей области. */
import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Maximize2, RefreshCw, X } from 'lucide-react';
import type { BotToken } from '@shared/schema';
import type { AnalyticsV2Snapshot } from '@shared/analytics/v2';
import { Button } from '@/components/ui/button';
import { useAcquisition } from './use-acquisition';
import { AnalyticsChartState } from './analytics-chart-state';
import { AnalyticsCollapsibleSection } from './analytics-collapsible-section';
import { AcquisitionLinkForm } from './acquisition-link-form';
import { AcquisitionExpenseForm } from './acquisition-expense-form';
import { AcquisitionReportTable } from './acquisition-report-table';
import { AcquisitionCatalog } from './acquisition-catalog';
import {budgetMarker,type BudgetTarget} from './acquisition-budget-source';
import type { AcquisitionExpense } from './acquisition-types';
/** Собирает рекламную область и передаёт выбор календарного дня общим фильтрам. @param props - Область, боты, снимок и выбор дня. @returns Отчёт, каталог и формы ссылок и расходов. */
export function AnalyticsAcquisitionSection({ projectId, tokenId, tokens, timezone, snapshot }: {
  /** Проект. */ projectId: number; /** Область выбранного бота. */ tokenId?: number | null;
  /** Доступные боты. */ tokens: BotToken[]; /** Пояс отчёта. */ timezone: string; /** Общий снимок. */ snapshot?: AnalyticsV2Snapshot;
}) {
  const catalog = useAcquisition(projectId);
  const client = useQueryClient();
  const expandButton = useRef<HTMLButtonElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState(false);
  /** Обновляет каталог и открытый рекламный отчёт без сброса формы. */
  async function refreshAcquisition() {
    setRefreshing(true); setRefreshError(false);
    try { await client.refetchQueries({ queryKey: ['analytics-acquisition', projectId], type: 'active' }, { throwOnError: true }); }
    catch { setRefreshError(true); }
    finally { setRefreshing(false); }
  }
  /** Закрывает увеличенный блок и возвращает фокус на кнопку. */
  function closeExpanded() { setExpanded(false); requestAnimationFrame(() => expandButton.current?.focus()); }
  /** Клавиша Escape закрывает увеличенный блок. */
  useEffect(() => {
    if (!expanded) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape' && !event.defaultPrevented) closeExpanded(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [expanded]);
  const [view, setView] = useState<'report' | 'link' | 'expense' | 'catalog'>(() => {
    try { const saved = localStorage.getItem(`analytics:acquisition-view:${projectId}`); if (saved === 'catalog' || saved === 'link' || saved === 'expense') return saved; } catch { /* Используем результаты при недоступном хранилище. */ }
    return 'report';
  });
  /** Восстанавливает открытый раздел рекламы вместе с позицией страницы. */
  useEffect(() => { try { localStorage.setItem(`analytics:acquisition-view:${projectId}`, view); } catch { /* Сохранение необязательно для работы вкладки. */ } }, [projectId, view]);
  const [expense, setExpense] = useState<AcquisitionExpense | undefined>();
  const [target,setTarget]=useState<BudgetTarget|undefined>();
  const [saved, setSaved] = useState(false);
  return <AnalyticsCollapsibleSection title="Источники и реклама">
    <section className={`analytics-card analytics-report-card analytics-acquisition-workspace border rounded-2xl ${expanded ? 'is-expanded' : ''}`}>
    <div className="analytics-acquisition-actions">
      <button type="button" aria-label="Обновить данные рекламы" title="Обновить данные рекламы" disabled={refreshing} onClick={() => void refreshAcquisition()}><RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin motion-reduce:animate-none' : ''}`} aria-hidden="true" /></button>
      {expanded ? <button type="button" aria-label="Свернуть рекламу" title="Свернуть рекламу" onClick={closeExpanded}><X className="h-4 w-4" aria-hidden="true" /></button> : <button ref={expandButton} type="button" aria-label="Развернуть рекламу" title="Развернуть рекламу" onClick={() => setExpanded(true)}><Maximize2 className="h-4 w-4" aria-hidden="true" /></button>}
    </div>
    {refreshError && <p role="alert" className="text-sm text-destructive">Не удалось обновить рекламные данные. Попробуйте ещё раз.</p>}
    <div className="analytics-acquisition-tabs flex flex-wrap gap-2" role="group" aria-label="Работа с рекламой">{[['report', 'Результаты'], ['link', 'Создать ссылку'], ['expense', 'Добавить рекламный бюджет'], ['catalog', 'Ссылки и бюджеты']].map(([key, label]) => <Button key={key} variant="outline" aria-pressed={view === key} onClick={() => { setView(key as typeof view); setSaved(false); if (key === 'expense') {setExpense(undefined);setTarget(undefined);} }}>{label}</Button>)}</div>
    {saved && <p role="status" className="text-sm">Рекламный бюджет сохранён. Отчёт обновлён.</p>}
    {catalog.isError ? <AnalyticsChartState title="Не удалось загрузить источники" description={catalog.error.message} onRetry={() => void catalog.refetch()} /> : !catalog.data ? <AnalyticsChartState loading /> : <>
      {view === 'report' && <AcquisitionReportTable tokens={tokens} projectId={projectId} tokenId={tokenId} snapshot={snapshot} renderBudget={(row, currency, onDone) => <AcquisitionExpenseForm tokens={tokens} tokenId={row.tokenId ?? tokenId} target={{ placementId: row.placementId, tokenId: row.tokenId, marker: budgetMarker(row.sourceKey), currency }} projectId={projectId} catalog={catalog.data} timezone={timezone} onSaved={() => { onDone(); setSaved(true); }} />} onAddBudget={(row,currency)=>{setExpense(undefined);setTarget({placementId:row.placementId,tokenId:row.tokenId,marker:budgetMarker(row.sourceKey),currency});setView('expense');setSaved(false);}} />}
      {/** Смена области сбрасывает выбранного в форме бота и неподтверждённый бюджет старой ссылки. */}
      {view === 'link' && <AcquisitionLinkForm key={`link:${projectId}:${tokenId ?? 'all'}`} projectId={projectId} timezone={timezone} tokenId={tokenId} tokens={tokens} />}
      {view === 'expense' && <AcquisitionExpenseForm key={expense?.id ?? `${tokenId ?? 'all'}:${JSON.stringify(target) ?? 'new'}`} tokens={tokens} tokenId={tokenId} target={target} projectId={projectId} catalog={catalog.data} timezone={timezone} expense={expense} onSaved={() => { setView('report'); setExpense(undefined); setSaved(true); }} />}
      {view === 'catalog' && <AcquisitionCatalog tokens={tokens} projectId={projectId} catalog={catalog.data} onEditExpense={item => { setTarget(undefined);setExpense(item); setView('expense'); }} />}
    </>}
    </section>
  </AnalyticsCollapsibleSection>;
}
