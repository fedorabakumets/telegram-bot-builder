/**
 * @fileoverview Утилиты и вспомогательные компоненты для SparklineChart
 * @description Форматирование дат, вычисление тиков, кастомный tooltip.
 */

import React from 'react';
import { GrowthPoint } from '../../hooks/queries/use-growth';

/**
 * Форматирует дату для тика оси X по гранулярности
 * @param dateStr - ISO строка даты
 * @param granularity - Гранулярность периода
 * @returns Отформатированная строка
 */
export function fmtTick(dateStr: string, granularity?: string): string {
  const d = new Date(dateStr);
  if (granularity === '1m' || granularity === '5m' || granularity === '1h') {
    return d.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString('ru', { day: 'numeric', month: 'short' });
}

/**
 * Форматирует дату для tooltip с полным контекстом
 * @param dateStr - ISO строка даты
 * @param granularity - Гранулярность периода
 * @returns Полная отформатированная строка
 */
export function fmtTooltipDate(dateStr: string, granularity?: string): string {
  const d = new Date(dateStr);
  if (granularity === '1m' || granularity === '5m' || granularity === '1h') {
    const date = d.toLocaleDateString('ru', { day: 'numeric', month: 'short' });
    const time = d.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' });
    return `${date} ${time}`;
  }
  return d.toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' });
}

/**
 * Вычисляет индексы тиков для отображения 3–4 меток на оси X
 * @param total - Общее количество точек
 * @returns Массив индексов для отображения
 */
export function getTickIndices(total: number): number[] {
  if (total <= 4) return Array.from({ length: total }, (_, i) => i);
  const step = Math.floor((total - 1) / 3);
  return [0, step, step * 2, total - 1];
}

/**
 * Пропсы кастомного tooltip
 */
interface CustomTooltipProps {
  /** Флаг активности tooltip */
  active?: boolean;
  /** Данные точки от recharts */
  payload?: Array<{ payload: GrowthPoint }>;
  /** Гранулярность для форматирования даты */
  granularity?: string;
}

/**
 * Преобразует массив точек в накопительный (каждая точка = сумма всех предыдущих)
 * @param points - Исходный массив точек
 * @returns Массив с накопительными значениями
 */
export function toCumulative(points: GrowthPoint[]): GrowthPoint[] {
  let sum = 0;
  return points.map(p => ({ date: p.date, count: (sum += p.count) }));
}

/**
 * Кастомный tooltip для recharts
 * @param props - Пропсы от recharts
 * @returns JSX элемент tooltip или null
 */
export function CustomTooltip({ active, payload, granularity }: CustomTooltipProps): React.JSX.Element | null {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="bg-popover border rounded-md px-2 py-1 text-xs">
      <span className="opacity-60">{fmtTooltipDate(point.date, granularity)}</span>
      <span className="ml-2 font-bold">{point.count}</span>
    </div>
  );
}
