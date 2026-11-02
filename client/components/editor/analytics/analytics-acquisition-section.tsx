/** @fileoverview Источники, конструктор ссылок и рекламный бюджет в единой рабочей области. */
import { useEffect, useState } from 'react';
import type { BotToken } from '@shared/schema';
import type { AnalyticsV2Snapshot } from '@shared/analytics/v2';
import { Button } from '@/components/ui/button';
import { useAcquisition } from './use-acquisition';
import { AnalyticsChartState } from './analytics-chart-state';
import { AcquisitionLinkForm } from './acquisition-link-form';
import { AcquisitionExpenseForm } from './acquisition-expense-form';
import { AcquisitionReportTable } from './acquisition-report-table';
import { AcquisitionCatalog } from './acquisition-catalog';
import type { AcquisitionExpense } from './acquisition-types';
/** Собирает рекламную область и передаёт выбор календарного дня общим фильтрам. @param props - Область, боты, снимок и выбор дня. @returns Отчёт, каталог и формы ссылок и расходов. */
export function AnalyticsAcquisitionSection({ projectId, tokenId, tokens, timezone, snapshot }: {
  /** Проект. */ projectId: number; /** Область выбранного бота. */ tokenId?: number | null;
  /** Доступные боты. */ tokens: BotToken[]; /** Пояс отчёта. */ timezone: string; /** Общий снимок. */ snapshot?: AnalyticsV2Snapshot;
}) {
  const catalog = useAcquisition(projectId);
  const [view, setView] = useState<'report' | 'link' | 'expense' | 'catalog'>(() => {
    try { const saved = localStorage.getItem(`analytics:acquisition-view:${projectId}`); if (saved === 'catalog' || saved === 'link' || saved === 'expense') return saved; } catch { /* Используем результаты при недоступном хранилище. */ }
    return 'report';
  });
  /** Восстанавливает открытый раздел рекламы вместе с позицией страницы. */
  useEffect(() => { try { localStorage.setItem(`analytics:acquisition-view:${projectId}`, view); } catch { /* Сохранение необязательно для работы вкладки. */ } }, [projectId, view]);
  const [expense, setExpense] = useState<AcquisitionExpense | undefined>();
  const [saved, setSaved] = useState(false);
  return <section className="analytics-card analytics-report-card border rounded-2xl">
    <header><div><h3 className="text-lg font-semibold">Источники и реклама</h3><p className="text-sm text-muted-foreground">Свяжите рекламную публикацию, новых пользователей и рекламный бюджет.</p></div></header>
    <div className="flex flex-wrap gap-2" role="group" aria-label="Работа с рекламой">{[['report', 'Результаты'], ['link', 'Создать ссылку'], ['expense', 'Добавить рекламный бюджет'], ['catalog', 'Ссылки и бюджеты']].map(([key, label]) => <Button key={key} variant="outline" aria-pressed={view === key} onClick={() => { setView(key as typeof view); setSaved(false); if (key === 'expense') setExpense(undefined); }}>{label}</Button>)}</div>
    {saved && <p role="status" className="text-sm">Рекламный бюджет сохранён. Отчёт обновлён.</p>}
    {catalog.isError ? <AnalyticsChartState title="Не удалось загрузить источники" description={catalog.error.message} onRetry={() => void catalog.refetch()} /> : !catalog.data ? <AnalyticsChartState loading /> : <>
      {view === 'report' && <AcquisitionReportTable tokens={tokens} projectId={projectId} tokenId={tokenId} snapshot={snapshot} />}
      {/** Смена области сбрасывает выбранного в форме бота и неподтверждённый бюджет старой ссылки. */}
      {view === 'link' && <AcquisitionLinkForm key={`link:${projectId}:${tokenId ?? 'all'}`} projectId={projectId} timezone={timezone} tokenId={tokenId} tokens={tokens} />}
      {view === 'expense' && <AcquisitionExpenseForm key={expense?.id ?? 'new'} projectId={projectId} catalog={catalog.data} timezone={timezone} expense={expense} onSaved={() => { setView('report'); setExpense(undefined); setSaved(true); }} />}
      {view === 'catalog' && <AcquisitionCatalog projectId={projectId} catalog={catalog.data} onEditExpense={item => { setExpense(item); setView('expense'); }} />}
    </>}
  </section>;
}
