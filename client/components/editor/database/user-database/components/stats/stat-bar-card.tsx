/**
 * @fileoverview Карточка статистики с горизонтальными барами
 * @description Отображает список элементов с процентными барами (без recharts)
 */

import React from 'react';

/**
 * Элемент списка для карточки с барами
 */
export interface StatBarItem {
  /** Метка элемента */
  label: string;
  /** Количество */
  count: number;
  /** Процент от общего числа */
  percentage: number;
  /** Цвет сегмента; если не задан, карточка берёт свою палитру */
  color?: string;
}

/**
 * Пропсы компонента StatBarCard
 */
export interface StatBarCardProps {
  /** Заголовок карточки */
  title: string;
  /** Список элементов с барами */
  items: StatBarItem[];
  /** Максимальное количество отображаемых элементов, по умолчанию 5 */
  maxItems?: number;
  /** Обработчик клика по элементу */
  onItemClick?: (label: string) => void;
}

/**
 * Карточка с горизонтальными барами для отображения распределения
 * @param props - Пропсы компонента
 * @returns JSX элемент карточки
 */
export function StatBarCard(props: StatBarCardProps): React.JSX.Element {
  const { title, items, maxItems = 5, onItemClick } = props;

  const visible = (items ?? []).slice(0, maxItems);
  const isEmpty = visible.length === 0;

  return (
    <div className="bg-background border rounded-xl p-3 flex flex-col gap-2 min-w-0">
      {/* Заголовок */}
      <p className="text-xs font-medium text-muted-foreground">{title}</p>

      {isEmpty ? (
        /* Пустое состояние */
        <p className="text-xs text-muted-foreground/50 italic">Нет данных</p>
      ) : (
        /* Список элементов с барами */
        <div className="flex flex-col gap-1.5">
          {visible.map((item) => (
          <div
            key={item.label}
            className={`flex flex-col gap-0.5 ${onItemClick ? 'cursor-pointer' : ''}`}
            onClick={() => onItemClick?.(item.label)}
            role={onItemClick ? 'button' : undefined}
            tabIndex={onItemClick ? 0 : undefined}
            onKeyDown={onItemClick
              ? (e) => e.key === 'Enter' && onItemClick(item.label)
              : undefined}
          >
            {/* Метка, количество и процент */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-foreground truncate max-w-[60%]">
                {item.label}
              </span>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="text-xs text-muted-foreground tabular-nums">
                  {item.count}
                </span>
                <span className="text-xs text-muted-foreground/60 tabular-nums">
                  {item.percentage}%
                </span>
              </div>
            </div>

            {/* Бар */}
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${Math.min(item.percentage, 100)}%` }}
              />
            </div>
          </div>
          ))}
        </div>
      )}
    </div>
  );
}
