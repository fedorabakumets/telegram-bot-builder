/**
 * @fileoverview Карточка «Группы» на аналитике и в статистике пользователей.
 * @module client/components/editor/analytics/analytics-groups-card
 */
import React, { useState } from 'react';
import { useProjectTokens } from '@/hooks/use-project-tokens';
import { StatMetricCard } from '@/components/editor/database/user-database/components/stats';
import { GrowthGranularitySelector } from '@/components/editor/database/user-database/components/stats/growth-granularity-selector';
import { ChartModeToggle, ChartMode } from '@/components/editor/database/user-database/components/stats/chart-mode-toggle';
import { ChartTypeToggle, ChartType } from '@/components/editor/database/user-database/components/stats/chart-type-toggle';
import { ChartGranularity } from '@/components/editor/database/user-database/hooks/queries/chart-granularity';
import { AnalyticsGroupsReachNote } from './analytics-groups-reach-note';
import { GroupsChartInfo } from './analytics-chart-info-texts';
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
 * График групп выбранного бота. При нескольких ботах без выбора просит выбрать бота.
 * @param props - Проект и бот
 * @returns Карточка
 */
export function AnalyticsGroupsCard({ projectId, selectedTokenId, stackHeader }: AnalyticsGroupsCardProps): React.JSX.Element {
  const tokens = useProjectTokens([projectId])[0]?.tokens ?? [];
  const tokenId = selectedTokenId ?? (tokens.length === 1 ? tokens[0].id : null);
  const [granularity, setGranularity] = useState<ChartGranularity>('1d');
  const [mode, setMode] = useState<ChartMode>('period');
  const [chartType, setChartType] = useState<ChartType>('line');
  const { stats, points, weeklyAdded } = useGroupsAnalytics(projectId, tokenId, granularity);

  if (!tokenId) {
    return (
      <div className="bg-background border rounded-xl p-3 text-sm text-muted-foreground">
        Группы: выберите бота
      </div>
    );
  }

  return (
    <StatMetricCard
      title="Группы"
      value={stats?.totalGroups}
      sparklineData={points}
      subtitle={weeklyAdded > 0 ? `+${weeklyAdded} за неделю` : undefined}
      trend={weeklyAdded > 0 ? 'up' : 'neutral'}
      cumulative={mode === 'cumulative'}
      cumulativeTotal={stats?.totalGroups}
      chartGranularity={granularity}
      chartHeight={160}
      chartType={chartType}
      stackHeader={stackHeader}
      lineColor="#8b5cf6"
      gradientId="analyticsGroups"
      info={<GroupsChartInfo />}
      footerExtra={
        <AnalyticsGroupsReachNote availableGroups={stats?.availableGroups} kickedGroups={stats?.kickedGroups} />
      }
      headerExtra={
        <div className="flex flex-wrap items-center gap-1">
          <GrowthGranularitySelector value={granularity} onChange={setGranularity} />
          <ChartModeToggle value={mode} onChange={setMode} />
          <ChartTypeToggle value={chartType} onChange={setChartType} />
        </div>
      }
    />
  );
}
