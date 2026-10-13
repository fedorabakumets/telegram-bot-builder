/**
 * @fileoverview Карточка графика по пользовательской таблице.
 * @module editor/analytics/table-chart/analytics-table-chart-card
 */
import React, { useEffect, useState } from 'react';
import { useTablesQuery, useColumnsQuery } from '@/components/editor/tables/hooks/use-tables-query';
import { TableAggregation, TableChartType } from './chart-types';
import { TableChartControls } from './table-chart-controls';
import { TableChartRender } from './table-chart-render';
import { TableChartInfo } from './table-chart-info';
import { useTableChartQuery } from './use-table-chart-query';

/** Подписи способов подсчёта. */
const AGG_TOOLTIP: Record<TableAggregation, string> = {
  count: 'Количество', sum: 'Сумма', avg: 'Среднее', min: 'Минимум', max: 'Максимум',
};

/** Свойства карточки. */
export interface AnalyticsTableChartCardProps {
  /** Проект. */
  projectId: number;
}

/**
 * Карточка графика: настройки остаются прежними, подсчёт выполняется на сервере.
 * @param props - Свойства.
 * @returns Карточка.
 */
export function AnalyticsTableChartCard({ projectId }: AnalyticsTableChartCardProps): React.JSX.Element {
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [xColumnId, setXColumnId] = useState<number | null>(null);
  const [yColumnId, setYColumnId] = useState<number | null>(null);
  const [aggregation, setAggregation] = useState<TableAggregation>('count');
  const [chartType, setChartType] = useState<TableChartType>('bar');
  const { data: tables = [] } = useTablesQuery(projectId);
  const { data: columns = [] } = useColumnsQuery(projectId, selectedTableId);
  const chartQuery = useTableChartQuery(projectId, selectedTableId, xColumnId, yColumnId, aggregation);
  const chart = chartQuery.data;
  const matches = !!chart && chart.table_id === selectedTableId && chart.x_column_id === xColumnId && chart.y_column_id === yColumnId;
  const yIsNumeric = matches ? chart.y_is_numeric : false;

  useEffect(() => {
    if (selectedTableId == null && tables.length > 0) setSelectedTableId(tables[0].id);
  }, [tables, selectedTableId]);
  useEffect(() => {
    if (columns.length === 0) return;
    if (xColumnId == null) setXColumnId(columns[0].id);
    if (yColumnId == null) setYColumnId(columns[1]?.id ?? columns[0].id);
  }, [columns, xColumnId, yColumnId]);
  useEffect(() => {
    if (matches && chart && !chart.y_is_numeric && aggregation !== 'count') setAggregation('count');
  }, [matches, chart, aggregation]);

  /** Сбрасывает столбцы при смене таблицы. */
  function handleTableChange(id: number): void {
    setSelectedTableId(id);
    setXColumnId(null);
    setYColumnId(null);
  }

  const points = matches && chart ? chart.points : [];
  const valueLabel = `${AGG_TOOLTIP[matches && chart ? chart.aggregation : aggregation]}: ${columns.find(column => column.id === yColumnId)?.name ?? ''}`;
  return (
    <div className="bg-background border rounded-xl p-3 flex flex-col gap-3">
      <span className="text-sm font-medium">График по таблице</span>
      <TableChartInfo />
      {tables.length === 0 ? (
        <p className="text-xs text-muted-foreground/50 italic py-8 text-center">Создайте таблицу во вкладке Таблицы</p>
      ) : (
        <>
          <TableChartControls
            tables={tables} selectedTableId={selectedTableId} onTableChange={handleTableChange}
            columns={columns} xColumnId={xColumnId} onXChange={setXColumnId} yColumnId={yColumnId} onYChange={setYColumnId}
            aggregation={yIsNumeric ? aggregation : 'count'} onAggregationChange={setAggregation}
            chartType={chartType} onChartTypeChange={setChartType} yIsNumeric={yIsNumeric}
          />
          {chartQuery.isError ? <p className="text-xs text-destructive text-center">Не удалось построить график</p>
            : chartQuery.isFetching && !matches ? <p className="text-xs text-muted-foreground/50 italic py-8 text-center">Считаем график</p>
            : <TableChartRender data={points} chartType={chartType} valueLabel={valueLabel} />}
          {matches && chart ? chart.warnings.map(warning => <p key={warning} className="text-[10px] text-muted-foreground">{warning}</p>) : null}
        </>
      )}
    </div>
  );
}
