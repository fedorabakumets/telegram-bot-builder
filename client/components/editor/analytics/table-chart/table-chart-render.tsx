/**
 * @fileoverview Рендер recharts-графика по агрегированным данным таблицы
 * @module editor/analytics/table-chart/table-chart-render
 */

import React from 'react';
import {
  ResponsiveContainer,
  BarChart, Bar,
  LineChart, Line,
  PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip,
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
}

/**
 * Рендерит recharts-график выбранного типа по агрегированным данным
 * @param props - Свойства компонента
 * @returns JSX элемент графика или пустое состояние
 */
export function TableChartRender({ data, chartType, valueLabel }: TableChartRenderProps): React.JSX.Element {
  if (data.length === 0) {
    return (
      <p className="text-xs text-muted-foreground/50 italic py-8 text-center">Нет данных для построения</p>
    );
  }

  if (chartType === 'pie') {
    return (
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="label" outerRadius={90} label>
            {data.map((_, i) => (
              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number) => [value, valueLabel]} />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (chartType === 'line') {
    return (
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data}>
          <XAxis dataKey="label" tick={{ fontSize: 10 }} />
          <YAxis />
          <Tooltip formatter={(value: number) => [value, valueLabel]} />
          <Line type="monotone" dataKey="value" stroke="#10b981" dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data}>
        <XAxis dataKey="label" tick={{ fontSize: 10 }} />
        <YAxis />
        <Tooltip formatter={(value: number) => [value, valueLabel]} />
        <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}
