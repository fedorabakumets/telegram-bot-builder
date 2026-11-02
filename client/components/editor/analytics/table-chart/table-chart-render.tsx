/**
 * @fileoverview Рендер recharts-графика по агрегированным данным таблицы
 * @module editor/analytics/table-chart/table-chart-render
 */

import React, { useState } from 'react';
import { TableChartValues } from './table-chart-values';
import { TableChartDetails } from './table-chart-details';
import { getTableChartScale } from './table-chart-scale';
import { TableChartAxes } from './table-chart-axes';
import { AnalyticsChartState } from '../analytics-chart-state';
import { ANALYTICS_TOOLTIP_THEME } from '../analytics-tooltip-theme';
import {
  ResponsiveContainer, CartesianGrid,
  BarChart, Bar,
  LineChart, Line,
  PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, LabelList,
} from 'recharts';
import { TableChartPoint, TableChartType } from './chart-types';

/** Палитра цветов для секторов круговой диаграммы */
const PIE_COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6', '#ec4899', '#84cc16'];

/**
 * Пропсы компонента рендера графика
 */
export interface TableChartRenderProps {
  /** Агрегированные точки данных */
  data: TableChartPoint[];
  /** Тип графика */
  chartType: TableChartType;
  /** Подпись значения для тултипа */
  valueLabel: string;
  /** Название столбца на горизонтальной оси. */
  categoryLabel: string;
  /** Выбранная категория при управлении извне. */
  selectedLabel?: string | null;
  /** Изменяет выбранную категорию. */
  onSelectedLabelChange?: (label: string | null) => void;
  /** Высота увеличенного графика. */
  expanded?: boolean;
}

/**
 * Строит диаграмму и явно подписывает её оси выбранными русскими названиями.
 * @param props - Свойства компонента
 * @returns JSX элемент графика или пустое состояние
 */
export function TableChartRender({ data, chartType, valueLabel, categoryLabel, selectedLabel, onSelectedLabelChange, expanded = false }: TableChartRenderProps): React.JSX.Element {
  /** Компактный график занимает меньше места, увеличенный сохраняет подробный масштаб. */
  const chartHeight = expanded ? 420 : 180;
  /** Выбор хранится вместе с исходным массивом, чтобы не показывать устаревшие данные после смены настроек. */
  const [selection, setSelection] = useState<{ /** Набор данных в момент выбора. */ data: TableChartPoint[]; /** Выбранная категория. */ point: TableChartPoint } | null>(null);
  const selected = onSelectedLabelChange ? data.find(point => point.label === selectedLabel) ?? null : selection?.data === data ? selection.point : null;
  /** Раскрывает полное значение выбранной категории. */
  const selectPoint = (point: TableChartPoint) => onSelectedLabelChange ? onSelectedLabelChange(point.label) : setSelection({ data, point });
  /** Извлекает категорию при нажатии в области столбца или линии. */
  const selectFromChart = (state: { /** Данные активной точки графика. */ activePayload?: Array<{ /** Исходная категория. */ payload?: TableChartPoint }> } | null) => {
    const point = state?.activePayload?.[0]?.payload;
    if (point) selectPoint(point);
  };
  /** Подробности и список остаются доступны как мышью, так и с клавиатуры. */
  const details = <div className="space-y-3">
    <p className="text-xs text-muted-foreground">Нажмите на столбец, точку или сектор, чтобы раскрыть полное название и точное значение.</p>
    {selected && <TableChartDetails point={selected} categoryLabel={categoryLabel} valueLabel={valueLabel} onClose={() => onSelectedLabelChange ? onSelectedLabelChange(null) : setSelection(null)} />}
    <TableChartValues data={data} selected={selected?.label} onSelect={selectPoint} />
  </div>;
  if (data.length === 0) {
    return (
      <AnalyticsChartState description="Выберите таблицу с записями и подходящие столбцы." />
    );
  }

  /** Деления числовой оси вычисляются по данным, а не выбираются библиотекой. */
  const scale = getTableChartScale(data.map(point => point.value));

  if (chartType === 'pie') {
    return (
      <TableChartAxes chartType={chartType} categoryLabel={categoryLabel} valueLabel={valueLabel} details={details}>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="label" outerRadius={expanded ? 140 : 90} isAnimationActive={false} onClick={point => selectPoint(point)} label>
            {data.map((_, i) => (
              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} opacity={selected && selected.label !== data[i].label ? 0.4 : 1} />
            ))}
          </Pie>
          <Tooltip {...ANALYTICS_TOOLTIP_THEME} formatter={(value: number) => [value, valueLabel]} />
        </PieChart>
      </ResponsiveContainer>
      </TableChartAxes>
    );
  }

  if (chartType === 'line') {
    return (
      <TableChartAxes chartType={chartType} categoryLabel={categoryLabel} valueLabel={valueLabel} details={details}>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <LineChart data={data} onClick={selectFromChart}>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 4" />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} minTickGap={32} interval="preserveStartEnd" tickFormatter={value => String(value).length > 12 ? `${String(value).slice(0, 12)}…` : String(value)} />
          <YAxis domain={scale.domain} ticks={scale.ticks} allowDecimals={!data.every(point => Number.isInteger(point.value))} tickFormatter={value => Number(value).toLocaleString('ru-RU')} tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} width={48} />
          <Tooltip {...ANALYTICS_TOOLTIP_THEME} formatter={(value: number) => [value, valueLabel]} />
          <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} dot={data.length <= 12} activeDot={{ r: 6 }} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
      </TableChartAxes>
    );
  }

  return (
    <TableChartAxes chartType={chartType} categoryLabel={categoryLabel} valueLabel={valueLabel} details={details}>
      <ResponsiveContainer width="100%" height={chartHeight}>
      <BarChart data={data} onClick={selectFromChart} margin={{ top: 24, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 4" />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} minTickGap={32} interval="preserveStartEnd" tickFormatter={value => String(value).length > 12 ? `${String(value).slice(0, 12)}…` : String(value)} />
        <YAxis domain={scale.domain} ticks={scale.ticks} allowDecimals={!data.every(point => Number.isInteger(point.value))} tickFormatter={value => Number(value).toLocaleString('ru-RU')} tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} width={48} />
        <Tooltip {...ANALYTICS_TOOLTIP_THEME} formatter={(value: number) => [value, valueLabel]} />
        <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} isAnimationActive={false}>
          {data.map(point => <Cell key={point.label} cursor="pointer" fill={selected?.label === point.label ? '#0ea5e9' : '#10b981'} fillOpacity={selected && selected.label !== point.label ? 0.4 : 1} />)}
          {data.length <= 12 && <LabelList dataKey="value" position="top" fontSize={12} fill="var(--foreground)" formatter={(value: number) => value.toLocaleString('ru-RU')} />}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
      </TableChartAxes>
  );
}
