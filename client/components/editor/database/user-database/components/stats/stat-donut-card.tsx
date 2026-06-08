/**
 * @fileoverview Карточка статистики с Donut-диаграммой (recharts PieChart)
 * @description Заменяет StatBarCard для карточек "Статус", "Источники трафика", "Языки"
 */

import React from 'react';
import { PieChart, Pie, Cell, Tooltip } from 'recharts';
import { StatBarItem } from './stat-bar-card';

/**
 * Базовая палитра цветов для сегментов Donut-диаграммы
 */
const DONUT_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ef4444', // red
  '#06b6d4', // cyan
  '#f97316', // orange
  '#84cc16', // lime
];

/**
 * Возвращает цвет сегмента по индексу; при нехватке базовых цветов генерирует HSL
 * @param index - Порядковый номер сегмента
 * @returns CSS-цвет сегмента
 */
function getDonutColor(index: number): string {
  if (index < DONUT_COLORS.length) return DONUT_COLORS[index];
  const hue = (index * 47) % 360;
  return `hsl(${hue}, 65%, 55%)`;
}

/**
 * Пропсы компонента StatDonutCard
 */
export interface StatDonutCardProps {
  /** Заголовок карточки */
  title: string;
  /** Список элементов диаграммы */
  items: StatBarItem[];
  /** Максимальное количество элементов; null — показать все, по умолчанию 8 */
  maxItems?: number | null;
  /** Обработчик клика по элементу легенды */
  onItemClick?: (label: string) => void;
  /** Дополнительные CSS классы для корневого элемента */
  className?: string;
}

/**
 * Пропсы кастомного Tooltip от recharts
 */
interface DonutTooltipProps {
  /** Флаг активности tooltip */
  active?: boolean;
  /** Данные точки */
  payload?: Array<{ name: string; value: number; payload: StatBarItem }>;
}

/**
 * Кастомный Tooltip для Donut-диаграммы
 * @param props - Пропсы от recharts
 * @returns JSX элемент tooltip или null
 */
function DonutTooltip({ active, payload }: DonutTooltipProps): React.JSX.Element | null {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="bg-popover border rounded-md px-2 py-1 text-xs shadow-md">
      <span className="font-medium">{item.label}</span>
      <span className="ml-2 tabular-nums">{item.count}</span>
      <span className="ml-1 opacity-60 tabular-nums">{item.percentage}%</span>
    </div>
  );
}

/**
 * Карточка статистики с Donut-диаграммой: donut слева, легенда справа
 * @param props - Пропсы компонента
 * @returns JSX элемент карточки
 */
export function StatDonutCard(props: StatDonutCardProps): React.JSX.Element {
  const { title, items, maxItems = 8, onItemClick, className } = props;

  const allItems = items ?? [];
  const visible = maxItems == null ? allItems : allItems.slice(0, maxItems);
  const isEmpty = visible.length === 0;
  const legendScrollable = visible.length > 8;

  /** Общая сумма всех count для отображения в центре дырки (приводим к числу) */
  const total = visible.reduce((sum, item) => sum + Number(item.count), 0);

  return (
    <div className={`bg-background border rounded-xl p-3 flex flex-col gap-2 min-w-0 ${className ?? ''}`}>
      {/* Заголовок карточки */}
      <p className="text-sm font-medium text-foreground">{title}</p>

      {isEmpty ? (
        /* Пустое состояние */
        <p className="text-xs text-muted-foreground/50 italic">Нет данных</p>
      ) : (
        /* Основной контент: donut слева + легенда справа */
        <div className="flex items-center gap-4 flex-1">
          {/* Donut-диаграмма с центральным числом */}
          <div className="relative flex-shrink-0" style={{ width: 140, height: 140 }}>
            <PieChart width={140} height={140}>
              <Pie
                data={visible}
                dataKey="count"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius={42}
                outerRadius={64}
                strokeWidth={0}
                isAnimationActive={false}
              >
                {visible.map((item, index) => (
                  <Cell
                    key={item.label}
                    fill={getDonutColor(index)}
                  />
                ))}
              </Pie>
              <Tooltip content={<DonutTooltip />} />
            </PieChart>
            {/* Центральное число поверх дырки */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-sm font-bold tabular-nums">{total}</span>
            </div>
          </div>

          {/* Легенда: цветная точка, метка, count, percentage; скролл при большом списке */}
          <div
            className={[
              'flex flex-col gap-1 min-w-0 flex-1',
              legendScrollable ? 'max-h-[220px] overflow-y-auto pr-1' : '',
            ].join(' ')}
          >
            {visible.map((item, index) => (
              <div
                key={item.label}
                className={`flex items-center gap-1.5 min-w-0 ${onItemClick ? 'cursor-pointer' : ''}`}
                onClick={() => onItemClick?.(item.label)}
                role={onItemClick ? 'button' : undefined}
                tabIndex={onItemClick ? 0 : undefined}
                onKeyDown={onItemClick
                  ? (e) => e.key === 'Enter' && onItemClick(item.label)
                  : undefined}
              >
                {/* Цветная точка */}
                <span
                  className="flex-shrink-0 w-2 h-2 rounded-full"
                  style={{ backgroundColor: getDonutColor(index) }}
                />
                {/* Метка */}
                <span className="text-xs text-foreground truncate flex-1 min-w-0">
                  {item.label}
                </span>
                {/* Количество и процент */}
                <span className="text-xs text-muted-foreground tabular-nums flex-shrink-0">
                  {item.count}
                </span>
                <span className="text-xs text-muted-foreground/60 tabular-nums flex-shrink-0">
                  {item.percentage}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
