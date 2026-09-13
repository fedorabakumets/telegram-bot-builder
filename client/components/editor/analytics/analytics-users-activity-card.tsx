/**
 * @fileoverview Карточка «Активные пользователи» на вкладке Аналитика
 * @module client/components/editor/analytics/analytics-users-activity-card
 */

import React, { useState } from 'react';
import { useUsersActivity, UsersActivityGranularity } from '@/components/editor/database/user-database/hooks/queries/use-users-activity';
import { StatMetricCard } from '@/components/editor/database/user-database/components/stats';
import { ActivityGranularitySelector } from '@/components/editor/database/user-database/components/stats/activity-granularity-selector';
import { ChartTypeToggle, ChartType } from '@/components/editor/database/user-database/components/stats/chart-type-toggle';
import {
  UserActivitySplitToggle,
  UserActivitySplitMode,
} from '@/components/editor/database/user-database/components/stats/user-activity-split-toggle';
import { UsersActivityChartInfo } from './analytics-chart-info-texts';

/**
 * Пропсы карточки активности пользователей
 */
export interface AnalyticsUsersActivityCardProps {
  /** Идентификатор проекта */
  projectId: number;
  /** Идентификатор выбранного токена бота */
  selectedTokenId?: number | null;
}

/**
 * Карточка с графиком уникальных активных пользователей
 * @param props - Пропсы компонента
 * @returns JSX элемент карточки
 */
export function AnalyticsUsersActivityCard({
  projectId,
  selectedTokenId,
}: AnalyticsUsersActivityCardProps): React.JSX.Element {
  const [granularity, setGranularity] = useState<UsersActivityGranularity>('1d');
  const [chartType, setChartType] = useState<ChartType>('line');
  const [splitMode, setSplitMode] = useState<UserActivitySplitMode>('total');

  const {
    points,
    newcomersPoints,
    returningPoints,
    activeInWindow,
    newInWindow,
  } = useUsersActivity({ projectId, selectedTokenId, granularity });

  const multiLine =
    splitMode === 'split'
      ? [
          { name: 'Новички', data: newcomersPoints, color: '#10b981' },
          { name: 'Вернувшиеся', data: returningPoints, color: '#6366f1' },
        ]
      : undefined;

  return (
    <StatMetricCard
      title="Активные пользователи"
      value={activeInWindow}
      sparklineData={splitMode === 'total' ? points : undefined}
      multiLineData={multiLine}
      lineColor="#0ea5e9"
      gradientId="analyticsUsersActivity"
      subtitle={newInWindow > 0 ? `${newInWindow} новичков` : undefined}
      trend={activeInWindow > 0 ? 'up' : 'neutral'}
      chartGranularity={granularity}
      chartHeight={160}
      chartType={chartType}
      info={<UsersActivityChartInfo />}
      headerExtra={
        <div className="flex flex-wrap items-center gap-1">
          <ActivityGranularitySelector value={granularity} onChange={setGranularity} />
          <ChartTypeToggle value={chartType} onChange={setChartType} />
          <UserActivitySplitToggle value={splitMode} onChange={setSplitMode} />
        </div>
      }
    />
  );
}
