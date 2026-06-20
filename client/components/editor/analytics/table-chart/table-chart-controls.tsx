/**
 * @fileoverview Панель управления конструктором графика (5 выпадающих списков)
 * @module editor/analytics/table-chart/table-chart-controls
 */

import React from 'react';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { TableAggregation, TableChartType } from './chart-types';

/** Подписи видов агрегации */
const AGGREGATION_LABELS: Record<TableAggregation, string> = {
  count: 'Количество',
  sum: 'Сумма',
  avg: 'Среднее',
  min: 'Минимум',
  max: 'Максимум',
};

/** Подписи типов графика */
const CHART_TYPE_LABELS: Record<TableChartType, string> = {
  bar: 'Столбцы',
  line: 'Линия',
  pie: 'Круговая',
};

/**
 * Пропсы панели управления конструктором графика
 */
export interface TableChartControlsProps {
  /** Список таблиц проекта */
  tables: Array<{ id: number; name: string }>;
  /** ID выбранной таблицы */
  selectedTableId: number | null;
  /** Обработчик смены таблицы */
  onTableChange: (id: number) => void;
  /** Колонки выбранной таблицы */
  columns: Array<{ id: number; name: string }>;
  /** ID колонки-категории (ось X) */
  xColumnId: number | null;
  /** Обработчик смены колонки X */
  onXChange: (id: number) => void;
  /** ID колонки-значения (ось Y) */
  yColumnId: number | null;
  /** Обработчик смены колонки Y */
  onYChange: (id: number) => void;
  /** Текущая агрегация */
  aggregation: TableAggregation;
  /** Обработчик смены агрегации */
  onAggregationChange: (a: TableAggregation) => void;
  /** Текущий тип графика */
  chartType: TableChartType;
  /** Обработчик смены типа графика */
  onChartTypeChange: (t: TableChartType) => void;
  /** Является ли колонка Y числовой (иначе доступен только count) */
  yIsNumeric: boolean;
}

/** Подпись над компактным селектом */
function FieldLabel({ text }: { text: string }): React.JSX.Element {
  return <span className="text-[10px] text-muted-foreground mb-0.5">{text}</span>;
}

/**
 * Компактный ряд из 5 селектов конфигурации графика
 * @param props - Свойства компонента
 * @returns JSX элемент панели управления
 */
export function TableChartControls(props: TableChartControlsProps): React.JSX.Element {
  const {
    tables, selectedTableId, onTableChange,
    columns, xColumnId, onXChange, yColumnId, onYChange,
    aggregation, onAggregationChange, chartType, onChartTypeChange, yIsNumeric,
  } = props;

  /** Доступные виды агрегации с учётом числовой колонки Y */
  const aggOptions: TableAggregation[] = ['count', 'sum', 'avg', 'min', 'max'];

  return (
    <div className="flex flex-wrap gap-2">
      <div className="flex flex-col min-w-[130px]">
        <FieldLabel text="Таблица" />
        <Select value={selectedTableId != null ? String(selectedTableId) : ''} onValueChange={(v) => onTableChange(Number(v))}>
          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Таблица" /></SelectTrigger>
          <SelectContent>
            {tables.map((t) => (
              <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col min-w-[120px]">
        <FieldLabel text="Категория (X)" />
        <Select value={xColumnId != null ? String(xColumnId) : ''} onValueChange={(v) => onXChange(Number(v))}>
          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Колонка" /></SelectTrigger>
          <SelectContent>
            {columns.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col min-w-[120px]">
        <FieldLabel text="Значение (Y)" />
        <Select value={yColumnId != null ? String(yColumnId) : ''} onValueChange={(v) => onYChange(Number(v))}>
          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Колонка" /></SelectTrigger>
          <SelectContent>
            {columns.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col min-w-[120px]">
        <FieldLabel text="Агрегация" />
        <Select value={aggregation} onValueChange={(v) => onAggregationChange(v as TableAggregation)}>
          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {aggOptions.map((a) => (
              <SelectItem key={a} value={a} disabled={a !== 'count' && !yIsNumeric}>
                {AGGREGATION_LABELS[a]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col min-w-[110px]">
        <FieldLabel text="Тип графика" />
        <Select value={chartType} onValueChange={(v) => onChartTypeChange(v as TableChartType)}>
          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {(Object.keys(CHART_TYPE_LABELS) as TableChartType[]).map((t) => (
              <SelectItem key={t} value={t}>{CHART_TYPE_LABELS[t]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
