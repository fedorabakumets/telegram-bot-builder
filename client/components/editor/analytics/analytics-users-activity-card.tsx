/**
 * @fileoverview Карточка «Активные пользователи» на вкладке Аналитика
 * @module client/components/editor/analytics/analytics-users-activity-card
 */

import { AnalyticsChartToolbar } from './analytics-chart-toolbar';
import { AnalyticsPeriodControl, AnalyticsTypeControl, AnalyticsUsersControl } from './analytics-chart-controls';
import React, { useState } from 'react';
import { useUsersActivity, UsersActivityGranularity } from '@/components/editor/database/user-database/hooks/queries/use-users-activity';
import { StatMetricCard } from '@/components/editor/database/user-database/components/stats';
import { ChartType } from '@/components/editor/database/user-database/components/stats/chart-type-toggle';
import {
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

  const returningInWindow = Math.max(0, activeInWindow - newInWindow);

  const multiLine =
    splitMode === 'split'
      ? [
          {
            name: 'Новички',
            data: newcomersPoints,
            color: '#10b981',
            legendTotal: newInWindow,
          },
          {
            name: 'Вернувшиеся',
            data: returningPoints,
            color: '#6366f1',
            legendTotal: returningInWindow,
          },
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
      chartHeight={224}
      chartType={chartType}
      info={<UsersActivityChartInfo />}
      headerExtra={
        <AnalyticsChartToolbar>
          <AnalyticsPeriodControl value={granularity} onChange={setGranularity} />
          <AnalyticsTypeControl value={chartType} onChange={setChartType} />
          <AnalyticsUsersControl value={splitMode} onChange={setSplitMode} />
        </AnalyticsChartToolbar>
      }
    />
  );
}
