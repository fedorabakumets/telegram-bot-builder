/**
 * @fileoverview Desktop карточка статистики
 * @description Компонент для отображения статистики на десктопе
 */

import { Card } from '@/components/ui/card';
import { StatCardProps } from './stat-card-types';

/**
 * Desktop карточка статистики
 * @param props - Пропсы компонента
 * @returns JSX компонент карточки
 */
export function DesktopStatCard({
  icon: Icon,
  label,
  fullLabel,
  value,
  gradient,
  bg,
  ring,
  testId,
}: StatCardProps) {
  return (
    <Card
      className={`${bg} group flex-1 rounded-xl p-3 lg:p-4 flex flex-col items-center gap-2 transition-all duration-200 hover:shadow-lg hover:scale-[1.03] cursor-default ring-1 ${ring} ring-opacity-50`}
      title={fullLabel}
      data-testid={testId}
    >
      <div
        className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow`}
      >
        <Icon className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
      </div>
      <div className="text-center">
        <p className="text-xl lg:text-2xl font-bold text-foreground tabular-nums leading-none">
          {value ?? 0}
        </p>
        <p className="text-[10px] lg:text-xs font-medium text-muted-foreground mt-1 uppercase tracking-wide">
          {label}
        </p>
      </div>
    </Card>
  );
}
