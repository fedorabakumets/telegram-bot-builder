/** @fileoverview Применение выбранного промежутка графика к общему периоду без округления до суток. */
import {createContext} from 'react';
import {reportDay,type AnalyticsReportFilter} from './analytics-report-filter';
/** Точные границы выбранного интервала в UTC. */
export interface ChartSelectedRange {
  /** Включённое начало. */ from:string;
  /** Исключённое окончание. */ to:string;
}
/** Общий обработчик доступен всем временным графикам внутри вкладки. */
export const AnalyticsChartRangeContext=createContext<((range:ChartSelectedRange)=>void)|null>(null);
/** Сохраняет точный промежуток и календарные даты для последующего ручного редактирования. */
export function chartRangeFilter(filter:AnalyticsReportFilter,range:ChartSelectedRange):AnalyticsReportFilter {
  return {...filter,period:'custom',step:'auto',interval:range,from:reportDay(new Date(range.from),filter.timezone),to:reportDay(new Date(Date.parse(range.to)-1),filter.timezone)};
}
