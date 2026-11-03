/** @fileoverview Общая кнопка открытия календаря из графиков, зависящих от периода. */
import {createContext,useContext} from 'react';
/** Открывает единственный календарь в шапке без отдельного фильтра карточки. */
export const AnalyticsOpenPeriodContext=createContext<(()=>void)|null>(null);
/** Показывает выбор общего периода внутри графика. */
export function AnalyticsChoosePeriod() {
  const open=useContext(AnalyticsOpenPeriodContext);
  return open ? <button type="button" onClick={open} className="analytics-choose-period self-start rounded-md border border-border px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Выбрать период</button> : null;
}
