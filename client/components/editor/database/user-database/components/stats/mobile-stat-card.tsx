/**
 * @fileoverview Мобильная карточка статистики
 * @description Компонент для отображения статистики на мобильных устройствах
 */

import { Card } from '@/components/ui/card';
import { StatCardProps } from './stat-card-types';

/**
 * Мобильная карточка статистики
 * @param props - Пропсы компонента
 * @returns JSX компонент карточки
 */
export function MobileStatCard({
  icon: Icon,
  label,
  value,
  gradient,
  bg,
  testId,
}: StatCardProps) {
  return (
    <Card
      className={`${bg} flex-shrink-0 snap-start w-[100px] rounded-xl p-3 flex flex-col items-center gap-2 transition-transform duration-200 active:scale-95`}
      data-testid={testId}
    >
      <div
        className={`w-8 h-8 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm`}
      >
        <Icon className="w-4 h-4 text-white" />
      </div>
      <div className="text-center">
        <p className="text-lg font-bold text-foreground tabular-nums">
          {value ?? 0}
        </p>
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </p>
      </div>
    </Card>
  );
}
