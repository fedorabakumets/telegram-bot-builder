/**
 * @fileoverview Компонент секции статистики
 * @description Отображает карточки статистики пользователей
 */

import { StatsCards } from '../components/stats';
import { DatabaseContentProps } from './database-content-props';

/**
 * Пропсы компонента DatabaseStatsSection
 */
interface DatabaseStatsSectionProps
  extends Pick<DatabaseContentProps, 'stats' | 'statsColumns' | 'panelDimensions'> {}

/**
 * Компонент секции статистики
 * @param props - Пропсы компонента
 * @returns JSX компонент статистики
 */
export function DatabaseStatsSection(props: DatabaseStatsSectionProps): React.JSX.Element | null {
  const { stats, statsColumns, panelDimensions } = props;

  if (!stats) {
    return null;
  }

  return <StatsCards stats={stats} statsColumns={statsColumns} panelDimensions={panelDimensions} />;
}
