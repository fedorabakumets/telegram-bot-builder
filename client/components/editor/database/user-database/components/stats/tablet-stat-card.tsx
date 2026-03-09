/**
 * @fileoverview Планшетная карточка статистики
 * @description Компонент для отображения статистики на планшетах
 */

import { Card } from '@/components/ui/card';
import { StatCardProps } from './stat-card-types';

/**
 * Планшетная карточка статистики
 * @param props - Пропсы компонента
 * @returns JSX компонент карточки
 */
export function TabletStatCard({
  icon: Icon,
  label,
  value,
  gradient,
  bg,
  testId,
}: StatCardProps) {
  return (
    <Card
      className={`${bg} rounded-xl p-3 flex items-center gap-3 transition-all duration-200 hover:shadow-md hover:scale-[1.02]`}
      data-testid={testId}
    >
      <div
        className={`w-10 h-10 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm flex-shrink-0`}
      >
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xl font-bold text-foreground tabular-nums">
          {value ?? 0}
        </p>
        <p className="text-xs text-muted-foreground truncate">{label}</p>
      </div>
    </Card>
  );
}
