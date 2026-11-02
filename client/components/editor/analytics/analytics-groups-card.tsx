/**
 * @fileoverview Карточка «Группы» на аналитике и в статистике пользователей.
 * @module client/components/editor/analytics/analytics-groups-card
 */
import { AnalyticsChartToolbar } from './analytics-chart-toolbar';
import { AnalyticsPeriodControl, AnalyticsModeControl, AnalyticsTypeControl } from './analytics-chart-controls';
import React, { useState } from 'react';
import { useProjectTokens } from '@/hooks/use-project-tokens';
import { StatMetricCard } from '@/components/editor/database/user-database/components/stats';
import { ChartMode } from '@/components/editor/database/user-database/components/stats/chart-mode-toggle';
import { ChartType } from '@/components/editor/database/user-database/components/stats/chart-type-toggle';
import { ChartGranularity } from '@/components/editor/database/user-database/hooks/queries/chart-granularity';
import { AnalyticsGroupsReachNote } from './analytics-groups-reach-note';
import { GroupsChartInfo } from './analytics-chart-info-texts';
import { periodGrowthLabel } from './period-growth-label';
import { useGroupsAnalytics } from './use-groups-analytics';

/** Пропсы карточки групп. */
export interface AnalyticsGroupsCardProps {
  /** Проект. */
  projectId: number;
  /** Бот из шапки. Пусто — «Все боты». */
  selectedTokenId?: number | null;
  /** Заголовок над переключателями, как в статистике базы. */
  stackHeader?: boolean;
}

/**
 * Показывает уникальные группы проекта или группы выбранного бота.
 * @param props - Проект и бот
 * @returns Карточка
 */
export function AnalyticsGroupsCard({ projectId, selectedTokenId, stackHeader }: AnalyticsGroupsCardProps): React.JSX.Element {
  const tokens = useProjectTokens([projectId])[0]?.tokens ?? [];
  const tokenId = selectedTokenId ?? (tokens.length === 1 ? tokens[0].id : null);
  const [granularity, setGranularity] = useState<ChartGranularity>('1d');
  const [mode, setMode] = useState<ChartMode>('period');
  const [chartType, setChartType] = useState<ChartType>('line');
  const { stats, points } = useGroupsAnalytics(projectId, tokenId, granularity);
  const period = periodGrowthLabel(points);


  return (
    <StatMetricCard
      title="Группы"
      value={stats?.totalGroups}
      sparklineData={points}
      subtitle={period.text}
      trend={period.total > 0 ? 'up' : 'neutral'}
      cumulative={mode === 'cumulative'}
      cumulativeTotal={stats?.totalGroups}
      chartGranularity={granularity}
      chartHeight={224}
      chartType={chartType}
      stackHeader={stackHeader}
      lineColor="#8b5cf6"
      gradientId="analyticsGroups"
      info={<GroupsChartInfo />}
      footerExtra={
        <AnalyticsGroupsReachNote availableGroups={stats?.availableGroups} kickedGroups={stats?.kickedGroups} />
      }
      headerExtra={
        <AnalyticsChartToolbar>
          <AnalyticsPeriodControl value={granularity} onChange={setGranularity} />
          <AnalyticsModeControl value={mode} onChange={setMode} />
          <AnalyticsTypeControl value={chartType} onChange={setChartType} />
        </AnalyticsChartToolbar>
      }
    />
  );
}
