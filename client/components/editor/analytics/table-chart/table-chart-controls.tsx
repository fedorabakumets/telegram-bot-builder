/**
 * @fileoverview Панель управления конструктором графика (5 выпадающих списков)
 * @module editor/analytics/table-chart/table-chart-controls
 */

import React from 'react';
import { getTableLabel, getColumnTitle } from '@/components/editor/tables/utils/display-labels';
import { TABLE_AGGREGATION_LABELS } from './table-chart-labels';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { TableAggregation, TableChartType } from './chart-types';

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
  columns: Array<{ /** Идентификатор столбца. */ id: number; /** Внутреннее имя. */ name: string; /** Пользовательская подпись столбца. */ settings?: { /** Название для интерфейса. */ displayName: string } }>;
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

/**
 * Показывает читаемую подпись поля настройки.
 * @param props - Текст подписи.
 * @returns Подпись поля.
 */
function FieldLabel({ text }: { text: string }): React.JSX.Element {
  return <span className="text-xs text-muted-foreground">{text}</span>;
}

/**
 * Показывает русские названия таблиц, столбцов и понятные настройки расчёта.
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
    <div className="analytics-table-controls">
      <div className="flex flex-col min-w-[130px]">
        <FieldLabel text="Таблица" />
        <Select value={selectedTableId != null ? String(selectedTableId) : ''} onValueChange={(v) => onTableChange(Number(v))}>
          <SelectTrigger aria-label="Таблица" className="h-10 text-sm"><SelectValue placeholder="Таблица" /></SelectTrigger>
          <SelectContent>
            {tables.map((t) => (
              <SelectItem key={t.id} value={String(t.id)}>{getTableLabel(t.name)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col min-w-[120px]">
        <FieldLabel text="Группировать по (X)" />
        <Select value={xColumnId != null ? String(xColumnId) : ''} onValueChange={(v) => onXChange(Number(v))}>
          <SelectTrigger aria-label="Группировать по (X)" className="h-10 text-sm"><SelectValue placeholder="Колонка" /></SelectTrigger>
          <SelectContent>
            {columns.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>{getColumnTitle(c)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col min-w-[120px]">
        <FieldLabel text="Значения (Y)" />
        <Select value={yColumnId != null ? String(yColumnId) : ''} onValueChange={(v) => onYChange(Number(v))}>
          <SelectTrigger aria-label="Значения (Y)" className="h-10 text-sm"><SelectValue placeholder="Колонка" /></SelectTrigger>
          <SelectContent>
            {columns.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>{getColumnTitle(c)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col min-w-[120px]">
        <FieldLabel text="Способ подсчёта" />
        <Select value={aggregation} onValueChange={(v) => onAggregationChange(v as TableAggregation)}>
          <SelectTrigger aria-label="Способ подсчёта" className="h-10 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            {aggOptions.map((a) => (
              <SelectItem key={a} value={a} disabled={a !== 'count' && !yIsNumeric}>
                {TABLE_AGGREGATION_LABELS[a]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col min-w-[110px]">
        <FieldLabel text="Тип графика" />
        <Select value={chartType} onValueChange={(v) => onChartTypeChange(v as TableChartType)}>
          <SelectTrigger aria-label="Тип графика" className="h-10 text-sm"><SelectValue /></SelectTrigger>
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
