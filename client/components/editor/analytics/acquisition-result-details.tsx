/** @fileoverview Сведения, краткий период, методика расчёта и загрузка рекламного отчёта. */
import type { ReactNode } from 'react';
import { budgetMarker } from './acquisition-budget-source';
import { acquisitionMoney } from './acquisition-money';
import type { AcquisitionReportRow } from './acquisition-types';
/** Форматирует короткий период, сохраняя часовой пояс в подписи. @param from - Начало. @param to - Окончание. @param timezone - Часовой пояс. @returns Подпись диапазона. */
export function acquisitionPeriodLabel(from: string, to: string, timezone: string) {
  const format = (value: string) => new Date(value).toLocaleDateString('ru-RU', { timeZone: timezone, day: 'numeric', month: 'short', year: 'numeric' });
  return `${format(from)} — ${format(to)} · ${timezone}`;
}
/** Показывает загрузку строк вместо имитации графика. @returns Доступное состояние ожидания отчёта. */
export function AcquisitionResultLoading() {
  return <div className="acquisition-results-loading" role="status"><span className="sr-only">Загрузка рекламного отчёта</span><div aria-hidden="true">{[0, 1, 2].map(row => <div key={row}>{[0, 1, 2, 3, 4, 5].map(cell => <span key={cell} />)}</div>)}</div></div>;
}
/** Свойства раскрытого результата. */
interface DetailsProps {
  /** Выбранная строка. */ row: AcquisitionReportRow;
  /** Валюта пересчёта. */ currency: string;
  /** Меняет валюту пересчёта. */ onCurrency: (currency: string) => void;
  /** Открывает ввод расхода непосредственно в подробностях. */ onAddBudget?: () => void;
  /** Форма расхода выбранного источника. */ budgetForm?: ReactNode;
  /** Закрывает сведения. */ onClose: () => void;
}
/** Показывает пересчитанные значения рядом с выбором их валюты. @param props - Результат и управление. @returns Сведения без вложенной карточки. */
export function AcquisitionResultDetails({ row, currency, onCurrency, onClose, onAddBudget, budgetForm }: DetailsProps) {
  return <section className="acquisition-result-details" aria-label={`Подробности: ${row.sourceName || row.name}`}>
    <header><h4>{row.name}</h4><button type="button" onClick={onClose}>Закрыть</button></header>
    <label className="acquisition-conversion-control"><span>Валюта пересчёта</span><select aria-label="Валюта пересчёта" className="analytics-native-field" value={currency} onChange={event => onCurrency(event.target.value)}><option value="RUB">Рубли · RUB</option><option value="USD">Доллары · USD</option></select></label>
    <dl><div><dt>Повторные запуски</dt><dd>{row.repeatStarts.toLocaleString('ru-RU')}</dd></div><div><dt>Расход с фиксированными курсами</dt><dd>{row.convertedSpend == null ? 'Не рассчитан' : acquisitionMoney(row.convertedSpend, row.currency)}</dd></div><div><dt>Цена нового после пересчёта</dt><dd>{row.costPerUser == null ? 'Не рассчитана' : acquisitionMoney(row.costPerUser, row.currency)}</dd></div></dl>
    {onAddBudget && (row.placementId != null || !!budgetMarker(row.sourceKey)) && !budgetForm && <button type="button" className="inline-flex items-center rounded-md border px-3 py-2 text-sm" onClick={onAddBudget}>Добавить расход</button>}
    {budgetForm}
    {row.reason && <p>{row.reason}</p>}
    {row.estimated && <p>Оценка: оплата распределена равномерно по дням.</p>}
    {row.currentDay && <p>На текущий момент: календарный день ещё не завершён.</p>}
  </section>;
}
