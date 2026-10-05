/**
 * @fileoverview Переключатель срока источников: 1ч–12м и «Все»
 * @module client/components/editor/analytics/sources-period-selector
 */

import React from 'react';
import {
  CHART_GRANULARITY_LABELS,
  CHART_GRANULARITY_ORDER,
  CHART_GRANULARITY_TITLES,
} from '@/components/editor/database/user-database/hooks/queries/chart-granularity';
import { SourcesPeriod } from './sources-period';

/**
 * Пропсы переключателя срока источников трафика
 */
export interface SourcesPeriodSelectorProps {
  /** Текущий срок */
  value: SourcesPeriod;
  /** Обработчик смены срока */
  onChange: (period: SourcesPeriod) => void;
}

/**
 * Кнопки окна прироста и отдельная кнопка всей аудитории
 * @param props - Пропсы компонента
 * @returns JSX элемент переключателя
 */
export function SourcesPeriodSelector({
  value,
  onChange,
}: SourcesPeriodSelectorProps): React.JSX.Element {
  return (
    <div className="flex items-center gap-0.5 flex-wrap">
      {CHART_GRANULARITY_ORDER.map((period) => (
        <PeriodButton
          key={period}
          label={CHART_GRANULARITY_LABELS[period]}
          title={CHART_GRANULARITY_TITLES[period]}
          active={value === period}
          onClick={() => onChange(period)}
        />
      ))}
      <PeriodButton
        label="Все"
        title="Вся аудитория, без ограничения по времени"
        active={value === 'all'}
        onClick={() => onChange('all')}
      />
    </div>
  );
}

/**
 * Пропсы одной кнопки срока
 */
interface PeriodButtonProps {
  /** Короткая подпись */
  label: string;
  /** Подсказка при наведении */
  title: string;
  /** Кнопка выбрана */
  active: boolean;
  /** Нажатие */
  onClick: () => void;
}

/**
 * Одна кнопка в полосе срока
 * @param props - Пропсы кнопки
 * @returns JSX элемент кнопки
 */
function PeriodButton({ label, title, active, onClick }: PeriodButtonProps): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={[
        'text-xs px-1.5 py-0.5 rounded transition-colors',
        active
          ? 'bg-primary/20 text-primary font-medium'
          : 'text-muted-foreground hover:text-foreground',
      ].join(' ')}
    >
      {label}
    </button>
  );
}
