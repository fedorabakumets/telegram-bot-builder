/**
 * @fileoverview Компонент секции статистики
 * @description Отображает карточки статистики пользователей
 */

import { StatsCards } from '../components/stats';

/**
 * Пропсы компонента DatabaseStatsSection
 */
interface DatabaseStatsSectionProps {
  /** Статистика пользователей */
  stats?: {
    totalUsers?: number;
    activeUsers?: number;
    blockedUsers?: number;
    premiumUsers?: number;
    totalInteractions?: number;
    avgInteractionsPerUser?: number;
    usersWithResponses?: number;
  };
}

/**
 * Компонент секции статистики
 * @param props - Пропсы компонента
 * @returns JSX компонент статистики
 */
export function DatabaseStatsSection(props: DatabaseStatsSectionProps): React.JSX.Element | null {
  const { stats } = props;

  if (!stats) {
    return null;
  }

  return <StatsCards stats={stats} />;
}
