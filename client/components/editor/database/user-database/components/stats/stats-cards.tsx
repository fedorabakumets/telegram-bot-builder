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
      {/* Горизонтальная прокрутка - карточки в одну строку */}
      <div className="flex gap-2 min-w-max p-3">
        {STATS_DATA.map((stat, idx) => (
          <div
            key={idx}
            className={`${stat.bg} flex-shrink-0 snap-start w-[100px] rounded-xl p-3 flex flex-col items-center gap-2 transition-transform duration-200 active:scale-95`}
            data-testid={`stat-card-${idx}`}
          >
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-sm`}>
              <stat.icon className="w-4 h-4 text-white" />
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-foreground tabular-nums">
                {statValues[idx]}
              </p>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                {stat.label}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
