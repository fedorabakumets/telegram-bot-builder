/** @fileoverview Строка рекламного отчёта с отдельными действиями и выравниванием чисел. */
import { ChevronRight } from 'lucide-react';
import { useId, type ReactNode } from 'react';
import { budgetMarker } from './acquisition-budget-source';
import { acquisitionMoney } from './acquisition-money';
import type { AcquisitionReportRow } from './acquisition-types';
/** Параметры строки рекламного результата. */
interface Props {
  /** Исходные данные. */ row: AcquisitionReportRow;
  /** Название бота. */ botName: string;
  /** Раскрыты ли сведения. */ selected: boolean;
  /** Содержимое непосредственно под выбранной строкой. */ details?: ReactNode;
  /** Переключает сведения. */ onToggle: () => void;
  /** Открывает форму бюджета в исходной валюте. */ onAddBudget?: (row: AcquisitionReportRow, currency: 'RUB' | 'USD') => void;
}
/** Показывает плотную строку результата; название бота доступно в подсказке источника. @param props - Данные и действия строки. @returns Строка таблицы. */
export function AcquisitionResultRow({ row, botName, selected, onToggle, onAddBudget, details }: Props) {
  const detailsId = useId();
  const canBudget = row.placementId != null || !!budgetMarker(row.sourceKey);
  const noPrice = row.costPerUserByCurrency?.RUB == null && row.costPerUserByCurrency?.USD == null;
  const reason = row.newUsers + (row.historicalUsers ?? 0) === 0 ? 'Нет первых контактов' : row.spend.RUB == null && row.spend.USD == null ? 'Расход не указан' : row.reason?.includes('курс') ? 'Не указан курс' : 'Недостаточно истории';
  return <><tr data-selected={selected}>
    <td><button type="button" className="acquisition-source-toggle" title={botName} aria-expanded={selected} aria-controls={selected ? detailsId : undefined} onClick={onToggle}><ChevronRight size={14} strokeWidth={1.5} aria-hidden="true" />{row.sourceName || row.name}</button></td>
    <td>{(row.newUsers + (row.historicalUsers ?? 0)).toLocaleString('ru-RU')}</td>
    <td>{row.returningUsers.toLocaleString('ru-RU')}</td>
    {(['RUB', 'USD'] as const).map(currency => <td key={currency}>{row.spend[currency] != null ? acquisitionMoney(row.spend[currency], currency) : canBudget && onAddBudget ? <button type="button" className="acquisition-budget-action" aria-label={`Указать бюджет ${currency}: ${row.sourceName || row.name}`} onClick={() => onAddBudget(row, currency)}>Указать</button> : <span className="text-muted-foreground" title={canBudget ? 'Расход не указан' : 'У этой категории нет рекламной метки'}>—<span className="sr-only"> {canBudget ? 'Расход не указан' : 'У этой категории нет рекламной метки'}</span></span>}</td>)}
    <td>{noPrice ? <span className="text-muted-foreground">{row.isDemo && row.demoCostPerContact ? `${acquisitionMoney(row.demoCostPerContact, row.currency)} · демо` : reason}</span> : <>{row.costPerUserByCurrency?.RUB != null && <p>{acquisitionMoney(row.costPerUserByCurrency.RUB, 'RUB')}</p>}{row.costPerUserByCurrency?.USD != null && <p>{acquisitionMoney(row.costPerUserByCurrency.USD, 'USD')}</p>}</>}{row.estimated && <p className="text-xs text-muted-foreground">Оценка</p>}{row.currentDay && <p className="acquisition-current-day text-xs">На текущий момент</p>}</td>
  </tr>{selected && details && <tr className="acquisition-result-detail-row"><td id={detailsId} colSpan={6}>{details}</td></tr>}</>;
}
