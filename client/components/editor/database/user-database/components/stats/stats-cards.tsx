/**
 * @fileoverview Компонент сетки статистических карточек
 * @description Отображает статистику пользователей в виде адаптивной сетки карточек
 */

import {
  Activity,
  BarChart3,
  Crown,
  Edit,
  MessageSquare,
  Shield,
  Users,
} from 'lucide-react';
import { UserStats } from '../../types';

/**
 * Пропсы компонента статистики
 */
interface StatsCardsProps {
  /** Статистика пользователей */
  stats: UserStats;
}

/**
 * Данные для карточек статистики
 */
const STATS_DATA = [
  {
    icon: Users,
    label: 'Всего',
    fullLabel: 'Всего пользователей',
    gradient: 'from-blue-500 to-blue-600',
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    ring: 'ring-blue-200 dark:ring-blue-800',
  },
  {
    icon: Activity,
    label: 'Активны',
    fullLabel: 'Активных пользователей',
    gradient: 'from-emerald-500 to-emerald-600',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    ring: 'ring-emerald-200 dark:ring-emerald-800',
  },
  {
    icon: Shield,
    label: 'Заблок.',
    fullLabel: 'Заблокировано',
    gradient: 'from-rose-500 to-rose-600',
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    ring: 'ring-rose-200 dark:ring-rose-800',
  },
  {
    icon: Crown,
    label: 'Premium',
    fullLabel: 'Premium пользователей',
    gradient: 'from-amber-500 to-amber-600',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    ring: 'ring-amber-200 dark:ring-amber-800',
  },
  {
    icon: MessageSquare,
    label: 'Сообщ.',
    fullLabel: 'Всего сообщений',
    gradient: 'from-violet-500 to-violet-600',
    bg: 'bg-violet-50 dark:bg-violet-950/40',
    ring: 'ring-violet-200 dark:ring-violet-800',
  },
  {
    icon: BarChart3,
    label: 'Среднее',
    fullLabel: 'Сообщений на пользователя',
    gradient: 'from-indigo-500 to-indigo-600',
    bg: 'bg-indigo-50 dark:bg-indigo-950/40',
    ring: 'ring-indigo-200 dark:ring-indigo-800',
  },
  {
    icon: Edit,
    label: 'Ответы',
    fullLabel: 'Пользователей с ответами',
    gradient: 'from-orange-500 to-orange-600',
    bg: 'bg-orange-50 dark:bg-orange-950/40',
    ring: 'ring-orange-200 dark:ring-orange-800',
  },
];

/**
 * Компонент сетки статистических карточек
 * @param props - Пропсы компонента
 * @returns JSX компонент сетки статистики
 */
export function StatsCards({ stats }: StatsCardsProps) {
  const statValues = [
    stats.totalUsers,
    stats.activeUsers,
    stats.blockedUsers,
    stats.premiumUsers,
    stats.totalInteractions,
    stats.avgInteractionsPerUser,
    stats.usersWithResponses || 0,
  ];

  return (
    <div className="w-full overflow-x-auto">
      {/* Карточки в одну строку с уменьшением при сужении */}
      <div className="flex gap-1.5 sm:gap-2 min-w-max w-full p-3">
        {STATS_DATA.map((stat, idx) => (
          <div
            key={idx}
            className={`${stat.bg} group flex-shrink-0 snap-start w-full max-w-[140px] sm:max-w-[120px] md:max-w-[110px] lg:max-w-[100px] xl:max-w-[120px] rounded-lg sm:rounded-xl p-1.5 sm:p-2.5 md:p-3 flex flex-col items-center gap-1 sm:gap-1.5 md:gap-2 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-95 ring-1 ${stat.ring} ring-opacity-50 cursor-default`}
            data-testid={`stat-card-${idx}`}
            title={stat.fullLabel}
          >
            <div className={`w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow`}>
              <stat.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white" />
            </div>
            <div className="text-center">
              <p className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-foreground tabular-nums leading-none">
                {statValues[idx]}
              </p>
              <p className="text-[8px] sm:text-[9px] md:text-[10px] font-medium text-muted-foreground mt-0.5 sm:mt-1 uppercase tracking-wide">
                {stat.label}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
