/**
 * @fileoverview Карточка графика по пользовательской таблице.
 * @module editor/analytics/table-chart/analytics-table-chart-card
 */
import { AnalyticsChartState } from '../analytics-chart-state';
import React, { useEffect, useState } from 'react';
import { useTablesQuery, useColumnsQuery } from '@/components/editor/tables/hooks/use-tables-query';
import { TableAggregation, TableChartType } from './chart-types';
import { TableChartControls } from './table-chart-controls';
import { getColumnTitle } from '@/components/editor/tables/utils/display-labels';
import { getTableChartValueLabel } from './table-chart-labels';
import { TableChartRender } from './table-chart-render';
import { TableChartInfo } from './table-chart-info';
import { useTableChartQuery } from './use-table-chart-query';
import { TableChartDateControl } from './table-chart-date-control';
import { AnalyticsReportPeriod } from '../analytics-report-period';

/** Свойства карточки. */
export interface AnalyticsTableChartCardProps {
  /** Проект. */
  projectId: number;
  /** Общие границы отчёта, если снимок успешно получен. */
  range?: { /** Начало. */ from: string; /** Конец. */ to: string; /** Пояс снимка. */ timezone?: string };
}

/**
 * Показывает серверный график таблицы и фактический период при включённом фильтре даты.
 * @param props - Свойства.
 * @returns Карточка.
 */
export function AnalyticsTableChartCard({ projectId, range }: AnalyticsTableChartCardProps): React.JSX.Element {
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [xColumnId, setXColumnId] = useState<number | null>(null);
  const [yColumnId, setYColumnId] = useState<number | null>(null);
  const [aggregation, setAggregation] = useState<TableAggregation>('count');
  const [chartType, setChartType] = useState<TableChartType>('bar');
  const [dateColumnId, setDateColumnId] = useState<number | null>(null);
  const { data: tables = [] } = useTablesQuery(projectId);
  const { data: columns = [] } = useColumnsQuery(projectId, selectedTableId);
  const chartQuery = useTableChartQuery(projectId, selectedTableId, xColumnId, yColumnId, aggregation, dateColumnId && range ? { dateColumnId, ...range } : undefined, dateColumnId == null || !!range);
  const chart = chartQuery.data;
  const matches = !!chart && chart.table_id === selectedTableId && chart.x_column_id === xColumnId && chart.y_column_id === yColumnId;
  const yIsNumeric = matches ? chart.y_is_numeric : false;

  useEffect(() => {
    if (selectedTableId == null && tables.length > 0) setSelectedTableId(tables[0].id);
  }, [tables, selectedTableId]);
  useEffect(() => {
    if (columns.length === 0) return;
    /** Для контента типы дают осмысленные группы вместо уникальных технических ID. */
    const content = tables.find(table => table.id === selectedTableId)?.name === '_content';
    if (xColumnId == null) setXColumnId((content ? columns.find(column => column.name === 'type') : undefined)?.id ?? columns[0].id);
    if (yColumnId == null) setYColumnId(columns[1]?.id ?? columns[0].id);
  }, [columns, xColumnId, yColumnId, tables, selectedTableId]);
  useEffect(() => {
    if (matches && chart && !chart.y_is_numeric && aggregation !== 'count') setAggregation('count');
  }, [matches, chart, aggregation]);

  /** Сбрасывает столбцы при смене таблицы. */
  function handleTableChange(id: number): void {
    setSelectedTableId(id);
    setXColumnId(null);
    setYColumnId(null);
    setDateColumnId(null);
  }

  /** Переводит типы контента, сохраняя исходные значения в пользовательских таблицах. */
  const contentTypes: Record<string, string> = { message: 'Сообщения', command: 'Команды', button: 'Кнопки', url: 'Ссылки', api_url: 'Адрес API', http_body: 'Тело запроса', http_headers: 'Заголовки' };
  const translateTypes = tables.find(table => table.id === selectedTableId)?.name === '_content'
    && columns.find(column => column.id === xColumnId)?.name === 'type';
  const points = matches && chart ? chart.points.map(point => ({ ...point,
    label: translateTypes ? contentTypes[point.label] ?? point.label : point.label })) : [];
  /** Оси используют те же русские подписи, что и выпадающие списки. */
  const categoryLabel = getColumnTitle(columns.find(column => column.id === xColumnId) ?? { name: 'Категории' });
  const valueLabel = getTableChartValueLabel(matches && chart ? chart.aggregation : aggregation,
    getColumnTitle(columns.find(column => column.id === yColumnId) ?? { name: 'Значения' }));
  return (
    <div className="analytics-card bg-background border rounded-xl p-4 flex flex-col gap-4">
      <h4 className="text-base font-semibold">График по таблице</h4>
      {tables.length === 0 ? (
        <AnalyticsChartState title="Добавьте данные проекта" description="Создайте таблицу во вкладке «Таблицы», затем выберите столбцы для графика." />
      ) : (
        <>
          <TableChartControls
            tables={tables} selectedTableId={selectedTableId} onTableChange={handleTableChange}
            columns={columns} xColumnId={xColumnId} onXChange={setXColumnId} yColumnId={yColumnId} onYChange={setYColumnId}
            aggregation={yIsNumeric ? aggregation : 'count'} onAggregationChange={setAggregation}
            chartType={chartType} onChartTypeChange={setChartType} yIsNumeric={yIsNumeric}
          />
          <TableChartDateControl columns={columns} value={dateColumnId} onChange={setDateColumnId} enabled={!!range} />
          {dateColumnId && range && <AnalyticsReportPeriod range={range} timezone={range.timezone ?? 'Europe/Moscow'} />}
          {dateColumnId && !range ? <AnalyticsChartState title="Ожидаем общий период" description="График появится после успешной загрузки периода отчёта." />
            : chartQuery.isError ? <AnalyticsChartState title="Не удалось построить график" description="Повторите загрузку или выберите другую таблицу." onRetry={() => void chartQuery.refetch()} />
            : chartQuery.isFetching && !matches ? <AnalyticsChartState loading />
            : <TableChartRender data={points} chartType={chartType} valueLabel={valueLabel} categoryLabel={categoryLabel} />}
          {matches && chart && chart.warnings.length > 0 && <div className="analytics-table-warning space-y-2">{chart.warnings.map(warning => <p key={warning}>{warning}</p>)}</div>}
        </>
      )}
      <TableChartInfo />
    </div>
  );
}
