/** @fileoverview Рекламные результаты с раздельными валютами и раскрытием ограничений расчёта. */
import { useState } from 'react';
import { acquisitionColumns, sortAcquisitionRows, type AcquisitionSortKey } from './acquisition-report-sort';
import type { AnalyticsV2Snapshot } from '@shared/analytics/v2';
import type { BotToken } from '@shared/schema';
import { useAcquisitionReport } from './use-acquisition';
import { reportTimeLabel } from './analytics-report-filter';
import { acquisitionMoney } from './acquisition-money';
import { AnalyticsChartState } from './analytics-chart-state';
/** Показывает рекламные результаты; выбор быстрого дня отменяет режим всего срока. @param props - Область, снимок и выбор календарного дня. @returns Расходы и цены за период либо полный срок размещений. */
export function AcquisitionReportTable({ projectId, tokenId, snapshot, tokens = [] }: {
  /** Доступные боты для понятных подписей строк. */ tokens?: BotToken[];
  /** Проект. */ projectId: number; /** Бот. */ tokenId?: number | null; /** Общий снимок. */ snapshot?: AnalyticsV2Snapshot;
}) {
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
  const chosen = rows.find(row => (row.rowKey ?? String(row.placementId)) === selected);
  return <section className="space-y-4"><div className="flex flex-wrap gap-4 items-end justify-between"><div><h3 className="text-lg font-semibold">Результаты рекламы</h3><p className="text-sm text-muted-foreground">Расходы и первые контакты за календарные дни</p></div>
    <div className="flex flex-wrap gap-3 items-center"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={lifetime} onChange={event => setLifetime(event.target.checked)} />За всё время</label><label className="analytics-control-field"><span>Валюта ручного пересчёта</span><select className="analytics-native-field" value={currency} onChange={event => setCurrency(event.target.value)}><option value="RUB">Рубли · RUB</option><option value="USD">Доллары · USD</option></select></label></div></div>
    {!lifetime && query.data?.from && query.data?.to && <p className="text-xs text-muted-foreground">Период рекламы: {reportTimeLabel(query.data.from, snapshot?.range.timezone ?? 'Europe/Moscow')} — {reportTimeLabel(query.data.to, snapshot?.range.timezone ?? 'Europe/Moscow')}. Текущий день — на данный момент; остальные графики сохраняют свой период.</p>}
    {query.isError ? <AnalyticsChartState title="Не удалось получить рекламный отчёт" description={query.error.message} onRetry={() => void query.refetch()} /> : !snapshot || query.isLoading ? <AnalyticsChartState loading /> : !rows.length ? <AnalyticsChartState title="Добавьте первый источник" description="Создайте ссылку, чтобы связать новые взаимодействия с рекламной публикацией." /> : <>
      <div className="analytics-table-scroll"><table className="analytics-report-table"><caption className="sr-only">Результаты рекламных источников {lifetime ? 'за весь срок' : 'за выбранный период'}</caption><thead><tr>{acquisitionColumns.map(({key,label}) => <th key={key} scope="col" aria-sort={sort?.key === key ? sort.descending ? 'descending' : 'ascending' : 'none'}><button type="button" onClick={() => changeSort(key)} title="Изменить порядок строк">{label} <span aria-hidden="true">{sort?.key === key ? sort.descending ? '↓' : '↑' : '↕'}</span></button></th>)}</tr></thead>
        <tbody>{rows.map(row => <tr key={row.rowKey ?? String(row.placementId)}><td><button type="button" aria-expanded={selected === (row.rowKey ?? String(row.placementId))} onClick={() => setSelected(selected === (row.rowKey ?? String(row.placementId)) ? null : (row.rowKey ?? String(row.placementId)))}>{row.sourceName || row.name}</button><p className="text-xs text-muted-foreground">{botLabel(row.tokenId)}</p></td><td>{(row.newUsers + (row.historicalUsers ?? 0)).toLocaleString('ru-RU')}{!!row.historicalUsers && <p className="text-xs text-muted-foreground">Из истории: {row.historicalUsers}</p>}</td><td>{row.returningUsers.toLocaleString('ru-RU')}</td><td>{acquisitionMoney(row.spend.RUB, 'RUB')}</td><td>{acquisitionMoney(row.spend.USD, 'USD')}</td><td>{row.costPerUserByCurrency?.RUB == null && row.costPerUserByCurrency?.USD == null ? <button type="button" className="text-muted-foreground" onClick={() => setSelected(row.rowKey ?? String(row.placementId))}>{row.isDemo && row.demoCostPerContact ? `${acquisitionMoney(row.demoCostPerContact, row.currency)} · демо` : row.newUsers + (row.historicalUsers ?? 0) === 0 ? 'Нет первых контактов' : row.spend.RUB == null && row.spend.USD == null ? 'Расход не указан' : row.reason?.includes('курс') ? 'Не указан курс' : 'Недостаточно истории'}</button> : <>{row.costPerUserByCurrency?.RUB != null && <p>{acquisitionMoney(row.costPerUserByCurrency.RUB, 'RUB')}</p>}{row.costPerUserByCurrency?.USD != null && <p>{acquisitionMoney(row.costPerUserByCurrency.USD, 'USD')}</p>}</>}{row.estimated && <p className="text-xs text-muted-foreground">Оценка</p>}{row.currentDay && <p className="text-xs text-muted-foreground">На текущий момент</p>}</td></tr>)}</tbody></table></div>
      {chosen && <div className="analytics-report-details space-y-3"><div className="flex justify-between gap-3"><strong>{chosen.name}</strong><button type="button" onClick={() => setSelected(null)}>Закрыть</button></div><dl className="flex flex-wrap gap-4"><div><dt className="text-muted-foreground">Повторные запуски</dt><dd>{chosen.repeatStarts.toLocaleString('ru-RU')}</dd></div><div><dt className="text-muted-foreground">Расход с фиксированными курсами</dt><dd>{chosen.convertedSpend == null ? 'Не рассчитан' : acquisitionMoney(chosen.convertedSpend, chosen.currency)}</dd></div><div><dt className="text-muted-foreground">Цена нового после пересчёта</dt><dd>{chosen.costPerUser == null ? 'Не рассчитана' : acquisitionMoney(chosen.costPerUser, chosen.currency)}</dd></div></dl>{chosen.reason && <p className="text-muted-foreground">{chosen.reason}</p>}<p className="text-xs text-muted-foreground">Запуски по ссылке не равны кликам. Цена считается по новым пользователям с известным первым взаимодействием. Суммы в исходных валютах показываются отдельно, даже когда курс для общего итога не указан.</p></div>}
      {chosen && (chosen.estimated || chosen.currentDay) && <p className="text-sm text-muted-foreground">{chosen.estimated ? 'Оценка: использовано равномерное распределение оплаты по дням. ' : ''}{chosen.currentDay ? 'На текущий момент: календарный день ещё не завершён.' : ''}</p>}
      <p className="text-xs text-muted-foreground">{lifetime ? 'Показаны источники за всё время.' : 'Готовые периоды рекламы считаются по календарным дням. Для часовых периодов показан текущий день.'} Валюты сохраняются отдельно. Пересчёт требует фиксированного курса каждой оплаты.</p>
      <p className="text-xs text-muted-foreground" role="status">{query.isFetching ? 'Обновляем рекламный отчёт…' : query.data?.asOf ? `Снимок рекламного отчёта: ${new Date(query.data.asOf).toLocaleString('ru-RU', { timeZone: snapshot.range.timezone })} · ${snapshot.range.timezone}` : ''}</p>
    </>}
  </section>;
}
