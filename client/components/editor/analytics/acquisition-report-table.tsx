/** @fileoverview Рекламные результаты с раздельными валютами и раскрытием ограничений расчёта. */
import { AnalyticsHeadingHint } from './analytics-heading-hint';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { AcquisitionResultRow } from './acquisition-result-row';
import { AcquisitionResultDetails, AcquisitionResultLoading, acquisitionPeriodLabel } from './acquisition-result-details';
import './acquisition-results.css';
import { reportTimeLabel } from './analytics-report-filter';
import type {AcquisitionReportRow} from './acquisition-types';
import { useState, type ReactNode } from 'react';
import { acquisitionColumns, sortAcquisitionRows, type AcquisitionSortKey } from './acquisition-report-sort';
import type { AnalyticsV2Snapshot } from '@shared/analytics/v2';
import type { BotToken } from '@shared/schema';
import { useAcquisitionReport } from './use-acquisition';
import { AnalyticsChartState } from './analytics-chart-state';
/** Показывает рекламные результаты; выбор быстрого дня отменяет режим всего срока. @param props - Область, снимок и выбор календарного дня. @returns Расходы и цены за период либо полный срок размещений. */
export function AcquisitionReportTable({ projectId, tokenId, snapshot, tokens = [], onAddBudget, renderBudget }: {
  /** Встраивает форму расхода с выбранным источником и валютой. */ renderBudget?: (row: AcquisitionReportRow, currency: 'RUB' | 'USD', onDone: () => void) => ReactNode;
  /** Переход к бюджету выбранного источника и валюты. */ onAddBudget?:(row:AcquisitionReportRow,currency:'RUB'|'USD')=>void;
  /** Доступные боты для понятных подписей строк. */ tokens?: BotToken[];
  /** Проект. */ projectId: number; /** Бот. */ tokenId?: number | null; /** Общий снимок. */ snapshot?: AnalyticsV2Snapshot;
}) {
  const [budgetCurrency, setBudgetCurrency] = useState<'RUB' | 'USD' | null>(null);
  const [currency, setCurrency] = useState('RUB');
  const [lifetime, setLifetime] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const query = useAcquisitionReport(projectId, tokenId, snapshot?.range, currency, lifetime);
  const [sort, setSort] = useState<{ /** Столбец. */ key: AcquisitionSortKey; /** По убыванию. */ descending: boolean } | null>(null);
  const rows = sort ? sortAcquisitionRows(query.data?.rows ?? [], sort.key, sort.descending) : query.data?.rows ?? [];
  /** Меняет направление активного столбца; числовые значения сначала показываются по убыванию. */
  function changeSort(key: AcquisitionSortKey) {
    setSort(previous => ({ key, descending: previous?.key === key ? !previous.descending : key !== 'name' }));
  }
  /** Возвращает публичное имя бота вместо внутреннего идентификатора. */
  function botLabel(id: number | null): string {
    if (id === null) return 'все боты';
    const bot = tokens.find(item => item.id === id);
    return bot?.botUsername ? `@${bot.botUsername.replace(/^@/, '')}` : bot?.name || 'Бот недоступен';
  }
  return <section className="acquisition-results space-y-4" aria-label="Результаты рекламы">
    <header className="acquisition-results-heading"><div><h3><AnalyticsHeadingHint label="Результаты рекламы" /></h3></div>
      <label className="acquisition-results-lifetime"><input type="checkbox" checked={lifetime} onChange={event => setLifetime(event.target.checked)} />За всё время</label>
    </header>
    <p className="acquisition-results-period" title={!lifetime && query.data?.from && query.data?.to ? `${reportTimeLabel(query.data.from, snapshot?.range.timezone ?? 'Europe/Moscow')} — ${reportTimeLabel(query.data.to, snapshot?.range.timezone ?? 'Europe/Moscow')}` : undefined}>{lifetime ? 'За всё время' : query.data?.from && query.data?.to ? acquisitionPeriodLabel(query.data.from, query.data.to, snapshot?.range.timezone ?? 'Europe/Moscow') : 'Загружаем период отчёта…'}</p>
    {query.isError ? <AnalyticsChartState title="Не удалось получить рекламный отчёт" description={query.error.message} onRetry={() => void query.refetch()} /> : !snapshot || query.isLoading ? <AcquisitionResultLoading /> : !rows.length ? <AnalyticsChartState title="Пока нет источников за этот период" description="Выберите другой период или создайте ссылку. Источник появится после первого запуска бота по ней." /> : <>
      <div className="analytics-table-scroll"><table className="analytics-report-table acquisition-results-table"><caption className="sr-only">Результаты рекламных источников {lifetime ? 'за весь срок' : 'за выбранный период'}</caption>
        <thead><tr>{acquisitionColumns.map(({key,label}) => {
          const active = sort?.key === key;
          const SortIcon = active ? sort.descending ? ArrowDown : ArrowUp : ArrowUpDown;
          return <th key={key} scope="col" aria-sort={active ? sort.descending ? 'descending' : 'ascending' : 'none'}><button type="button" onClick={() => changeSort(key)} title="Изменить порядок строк">{label}<SortIcon size={14} strokeWidth={1.5} aria-hidden="true" /></button></th>;
        })}</tr></thead>
        <tbody>{rows.map(row => <AcquisitionResultRow key={row.rowKey ?? String(row.placementId)} row={row} botName={botLabel(row.tokenId)} selected={selected === (row.rowKey ?? String(row.placementId))} onToggle={() => { setBudgetCurrency(null); setSelected(selected === (row.rowKey ?? String(row.placementId)) ? null : (row.rowKey ?? String(row.placementId))); }} onAddBudget={onAddBudget} details={<AcquisitionResultDetails row={row} currency={currency} onCurrency={setCurrency} onClose={() => { setSelected(null); setBudgetCurrency(null); }} onAddBudget={renderBudget ? () => setBudgetCurrency(currency === 'USD' ? 'USD' : 'RUB') : onAddBudget ? () => onAddBudget(row, currency === 'USD' ? 'USD' : 'RUB') : undefined} budgetForm={budgetCurrency && renderBudget ? renderBudget(row, budgetCurrency, () => setBudgetCurrency(null)) : undefined} />} />)}</tbody>
      </table></div>
      <p className="acquisition-results-snapshot" role="status">{query.data?.asOf ? `Обновлено ${new Date(query.data.asOf).toLocaleString('ru-RU', { timeZone: snapshot.range.timezone, day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} · ${snapshot.range.timezone}` : ''}</p>
    </>}
  </section>;
}
