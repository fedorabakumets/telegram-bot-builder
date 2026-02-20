/**
 * @fileoverview Статистика базы пользователей
 * Отображает общую статистику по ID пользователей
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserPlus, Clock } from 'lucide-react';

/**
 * Статистика базы пользователей
 */
interface UserIdStatsData {
  /** Общее количество ID */
  total: number;
  /** Добавлено за сегодня */
  addedToday: number;
  /** Добавлено за неделю */
  addedThisWeek: number;
}

interface UserIdStatsProps {
  /** Данные статистики */
  stats: UserIdStatsData;
}

/**
 * Компонент статистики базы пользователей
 */
export function UserIdStats({ stats }: UserIdStatsProps) {
  const statCards = [
    {
      title: 'Всего ID',
      value: stats.total.toString(),
      icon: Users,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-100 dark:bg-blue-900/20',
    },
    {
      title: 'За сегодня',
      value: `+${stats.addedToday}`,
      icon: UserPlus,
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-100 dark:bg-green-900/20',
    },
    {
      title: 'За неделю',
      value: `+${stats.addedThisWeek}`,
      icon: Clock,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-100 dark:bg-purple-900/20',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {statCards.map((stat) => (
        <Card key={stat.title} className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
