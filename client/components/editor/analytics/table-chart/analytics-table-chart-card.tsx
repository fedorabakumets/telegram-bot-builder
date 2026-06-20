/**
 * @fileoverview Главная карточка-конструктор графика по пользовательской таблице
 * @module editor/analytics/table-chart/analytics-table-chart-card
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useTablesQuery, useColumnsQuery, useRowsQuery } from '@/components/editor/tables/hooks/use-tables-query';
import { TableAggregation, TableChartType } from './chart-types';
import { aggregateTableData, isNumericColumn } from './aggregate-table-data';
import { TableChartControls } from './table-chart-controls';
import { TableChartRender } from './table-chart-render';

/** Подписи агрегаций для тултипа значения */
const AGG_TOOLTIP: Record<TableAggregation, string> = {
  count: 'Количество', sum: 'Сумма', avg: 'Среднее', min: 'Минимум', max: 'Максимум',
};

/**
 * Пропсы карточки-конструктора графика
 */
export interface AnalyticsTableChartCardProps {
  /** Идентификатор проекта */
  projectId: number;
}

/**
 * Карточка-конструктор графика по пользовательской таблице
 * @param props - Свойства компонента
 * @returns JSX элемент карточки
 */
export function AnalyticsTableChartCard({ projectId }: AnalyticsTableChartCardProps): React.JSX.Element {
  /** ID выбранной таблицы */
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  /** ID колонки-категории (ось X) */
  const [xColumnId, setXColumnId] = useState<number | null>(null);
  /** ID колонки-значения (ось Y) */
  const [yColumnId, setYColumnId] = useState<number | null>(null);
  /** Текущая агрегация */
  const [aggregation, setAggregation] = useState<TableAggregation>('count');
  /** Текущий тип графика */
  const [chartType, setChartType] = useState<TableChartType>('bar');

  const { data: tables = [] } = useTablesQuery(projectId);
  const { data: columns = [] } = useColumnsQuery(projectId, selectedTableId);
  const { data: rows = [] } = useRowsQuery(projectId, selectedTableId);

  /** Автовыбор первой таблицы */
  useEffect(() => {
    if (selectedTableId == null && tables.length > 0) {
      setSelectedTableId(tables[0].id);
    }
  }, [tables, selectedTableId]);

  /** Автовыбор колонок: X — первая, Y — вторая (если есть) */
  useEffect(() => {
    if (columns.length === 0) return;
    if (xColumnId == null) setXColumnId(columns[0].id);
    if (yColumnId == null) setYColumnId(columns[1]?.id ?? columns[0].id);
  }, [columns, xColumnId, yColumnId]);

  /**
   * Смена таблицы со сбросом выбранных колонок
   * @param id - ID новой таблицы
   */
  function handleTableChange(id: number): void {
    setSelectedTableId(id);
    setXColumnId(null);
    setYColumnId(null);
  }

  /** Является ли колонка Y числовой */
  const yIsNumeric = yColumnId ? isNumericColumn(rows, String(yColumnId)) : false;

  /** Эффективная агрегация: для нечисловой Y допустим только count */
  const effectiveAgg: TableAggregation = yIsNumeric ? aggregation : 'count';

  /** Принудительный сброс агрегации на count для нечисловой колонки */
  useEffect(() => {
    if (!yIsNumeric && aggregation !== 'count') setAggregation('count');
  }, [yIsNumeric, aggregation]);

  /** Агрегированные точки для графика */
  const points = useMemo(
    () => (xColumnId && yColumnId)
      ? aggregateTableData(rows, String(xColumnId), String(yColumnId), effectiveAgg)
      : [],
    [rows, xColumnId, yColumnId, effectiveAgg],
  );

  /** Имя Y-колонки для подписи тултипа */
  const yColumnName = columns.find((c) => c.id === yColumnId)?.name ?? '';
  const valueLabel = `${AGG_TOOLTIP[effectiveAgg]}: ${yColumnName}`;

  return (
    <div className="bg-background border rounded-xl p-3 flex flex-col gap-3">
      <span className="text-sm font-medium">График по таблице</span>
      {tables.length === 0 ? (
        <p className="text-xs text-muted-foreground/50 italic py-8 text-center">
          Создайте таблицу во вкладке Таблицы
        </p>
      ) : (
        <>
          <TableChartControls
            tables={tables}
            selectedTableId={selectedTableId}
            onTableChange={handleTableChange}
            columns={columns}
            xColumnId={xColumnId}
            onXChange={setXColumnId}
            yColumnId={yColumnId}
            onYChange={setYColumnId}
            aggregation={effectiveAgg}
            onAggregationChange={setAggregation}
            chartType={chartType}
            onChartTypeChange={setChartType}
            yIsNumeric={yIsNumeric}
          />
          <TableChartRender data={points} chartType={chartType} valueLabel={valueLabel} />
        </>
      )}
    </div>
  );
}
