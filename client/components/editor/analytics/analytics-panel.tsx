/**
 * @fileoverview Панель аналитики — статистика и рост аудитории бота
 * @description Отображает числовые карточки с графиками и donut-диаграммы
 */

import React, { useState, useEffect, useCallback } from 'react';
import { BarChart2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TabHeader } from '@/components/ui/tab-header';
import { useQueryClient } from '@tanstack/react-query';
import { useStats } from '@/components/editor/database/user-database/hooks/queries/use-stats';
import { useGrowth, GrowthGranularity } from '@/components/editor/database/user-database/hooks/queries/use-growth';
import { useGrowthBySource } from '@/components/editor/database/user-database/hooks/queries/use-growth-by-source';
import { useTraffic } from '@/components/editor/database/user-database/hooks/queries/use-traffic';
import { useMessagesActivity, Granularity } from '@/components/editor/database/user-database/hooks/queries/use-messages-activity';
import { StatMetricCard, StatDonutCard } from '@/components/editor/database/user-database/components/stats';
import { ActivityGranularitySelector } from '@/components/editor/database/user-database/components/stats/activity-granularity-selector';
import { GrowthGranularitySelector } from '@/components/editor/database/user-database/components/stats/growth-granularity-selector';
import { ChartModeToggle, ChartMode } from '@/components/editor/database/user-database/components/stats/chart-mode-toggle';
import { ChartTypeToggle, ChartType } from '@/components/editor/database/user-database/components/stats/chart-type-toggle';
import { SourceModeToggle, SourceMode } from '@/components/editor/database/user-database/components/stats/source-mode-toggle';
import { ActivitySplitToggle, ActivitySplitMode } from '@/components/editor/database/user-database/components/stats/activity-split-toggle';
import { aggregateTopSources } from '@/components/editor/database/user-database/components/stats/source-aggregation-utils';
import { BotTokenSelector } from '@/components/editor/database/user-database/components/header/bot-token-selector';
import { useProjectTokens } from '@/hooks/use-project-tokens';
import { useLiveInvalidate } from '@/components/editor/database/user-database/hooks/use-live-invalidate';
import { AnalyticsSourcesChart } from './analytics-sources-chart';
import { AnalyticsPopularButtonsChart } from './analytics-popular-buttons-chart';
import { AnalyticsTableChartCard } from './table-chart/analytics-table-chart-card';


import { ProjectSelector } from '@/components/editor/database/user-database/components/header/project-selector';

/**
 * Пропсы компонента AnalyticsPanel
 */
export interface AnalyticsPanelProps {
  /** Идентификатор проекта */
  projectId: number;
  /** Идентификатор выбранного токена бота */
  selectedTokenId?: number | null;
  /** Обработчик выбора токена */
  onSelectToken?: (tokenId: number | null) => void;
  /** Список всех проектов для переключателя */
  allProjects?: Array<{ id: number; name: string }>;
  /** Обработчик смены проекта */
  onProjectChange?: (projectId: number) => void;
}

/**
 * Вычисляет процент от общего числа
 * @param count - Количество в группе
 * @param total - Общее количество
 * @returns Процент от 0 до 100
 */
function pct(count: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((count / total) * 100);
}

/**
 * Панель аналитики: числовые карточки с графиками и donut-диаграммы
 * @param props - Пропсы компонента
 * @returns JSX элемент панели аналитики
 */
export function AnalyticsPanel({ projectId, selectedTokenId, onSelectToken, allProjects, onProjectChange }: AnalyticsPanelProps): React.JSX.Element {
  /** Гранулярность графика прироста */
  const [growthGranularity, setGrowthGranularity] = useState<GrowthGranularity>('1d');
  /** Гранулярность графика активности */
  const [msgGranularity, setMsgGranularity] = useState<Granularity>('1d');
  /** Режим графика прироста: за период или накопительно */
  const [growthMode, setGrowthMode] = useState<ChartMode>('period');
  /** Режим графика активности: за период или накопительно */
  const [activityMode, setActivityMode] = useState<ChartMode>('period');
  /** Тип графика прироста: столбчатый или линейный */
  const [growthChartType, setGrowthChartType] = useState<ChartType>('line');
  /** Тип графика активности: столбчатый или линейный */
  const [activityChartType, setActivityChartType] = useState<ChartType>('line');
  /** Режим отображения источников: общий или по источникам */
  const [sourceMode, setSourceMode] = useState<SourceMode>('total');
  /** Режим отображения активности: все сообщения / входящие+исходящие */
  const [activitySplitMode, setActivitySplitMode] = useState<ActivitySplitMode>('total');

  /** Токены проекта для селектора бота */
  const projectTokensInfo = useProjectTokens([projectId]);
  const tokens = projectTokensInfo[0]?.tokens ?? [];
  const queryClient = useQueryClient();

  /** Подписка на WS-события — real-time инвалидация кэша статистики и графиков */
  useLiveInvalidate({ projectId, selectedTokenId });

  /**
   * Смена гранулярности прироста с принудительной инвалидацией кэша источников
   * @param g - Новое значение гранулярности
   */
  const handleGrowthGranularityChange = useCallback((g: GrowthGranularity) => {
    setGrowthGranularity(g);
    queryClient.invalidateQueries({
      queryKey: ['users-growth-by-source', projectId, selectedTokenId],
    });
    queryClient.invalidateQueries({
      queryKey: ['users-growth', projectId, selectedTokenId],
    });
  }, [queryClient, projectId, selectedTokenId]);

  /** Автовыбор дефолтного токена при загрузке, если ничего не выбрано */
  useEffect(() => {
    if (tokens.length === 0) return;
    const alreadySelected = tokens.some((t) => t.id === selectedTokenId);
    if (alreadySelected) return;
    const next = tokens.find((t) => t.isDefault === 1) ?? tokens[0];
    onSelectToken?.(next?.id ?? null);
  }, [tokens, selectedTokenId, onSelectToken]);

  const { stats, refetchStats } = useStats({ projectId, selectedTokenId });
  const { points: growthPoints, weeklyGrowth } = useGrowth({ projectId, selectedTokenId, granularity: growthGranularity });
  const { points: sourcePoints } = useGrowthBySource({ projectId, selectedTokenId, granularity: growthGranularity });
  const { languages, sources } = useTraffic({ projectId, selectedTokenId });
  const { points: messagePoints, outgoingPoints, weeklyMessages } = useMessagesActivity({ projectId, selectedTokenId, granularity: msgGranularity, split: activitySplitMode === 'split' });

  /** Multi-line данные для графика активности: входящие + исходящие (только в режиме split) */
  const activityMultiLine = activitySplitMode === 'split' ? [
    { name: 'Входящие', data: messagePoints, color: '#10b981' },
    { name: 'Исходящие', data: outgoingPoints, color: '#6366f1' },
  ] : undefined;

  const total = stats.totalUsers ?? 0;
  const growthTrend = weeklyGrowth > 0 ? 'up' : weeklyGrowth < 0 ? 'down' : 'neutral';
  const multiLineData = aggregateTopSources(sourcePoints, 5);

  /** Элементы для donut-карточки источников трафика */
  const sourceItems = sources.map(s => ({ label: s.param, count: s.count, percentage: s.percentage }));
  /** Элементы для donut-карточки языков */
  const languageItems = languages.map(l => ({ label: l.code, count: l.count, percentage: l.percentage }));
  /** Элементы для donut-карточки Premium / не Premium */
  const statusItems = [
    { label: 'Premium', count: stats.premiumUsers ?? 0, percentage: pct(stats.premiumUsers ?? 0, total) },
    { label: 'Обычные', count: Math.max(0, total - (stats.premiumUsers ?? 0)), percentage: pct(Math.max(0, total - (stats.premiumUsers ?? 0)), total) },
  ];

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Шапка */}
      <TabHeader
        icon={<BarChart2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />}
        title="Аналитика"
        actions={
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => refetchStats()}>
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Обновить</span>
          </Button>
        }
      >
        {allProjects && allProjects.length > 1 && onProjectChange && (
          <ProjectSelector
            projects={allProjects}
            selectedProjectId={projectId}
            onSelect={(id) => { onSelectToken?.(null); onProjectChange(id); }}
          />
        )}
        {tokens.length > 0 && (
          <BotTokenSelector
            tokens={tokens}
            selectedTokenId={selectedTokenId ?? null}
            onSelect={(id) => onSelectToken?.(id)}
          />
        )}
      </TabHeader>

      {/* Контент */}
      <ScrollArea className="flex-1">
        <div className="p-4 flex flex-col gap-4">
          {/* Строка 1: прирост пользователей + активность сообщений */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <StatMetricCard
              title="Всего пользователей"
              value={stats.totalUsers}
              sparklineData={sourceMode === 'total' ? growthPoints : undefined}
              multiLineData={sourceMode === 'by-source' ? multiLineData : undefined}
              trend={growthTrend}
              subtitle={weeklyGrowth > 0 ? `+${weeklyGrowth} за неделю` : undefined}
              cumulative={growthMode === 'cumulative'}
              chartGranularity={growthGranularity}
              chartHeight={160}
              chartType={growthChartType}
              headerExtra={
                <div className="flex flex-wrap items-center gap-1">
                  <GrowthGranularitySelector value={growthGranularity} onChange={handleGrowthGranularityChange} />
                  <ChartModeToggle value={growthMode} onChange={setGrowthMode} />
                  <ChartTypeToggle value={growthChartType} onChange={setGrowthChartType} />
                  <SourceModeToggle value={sourceMode} onChange={setSourceMode} />
                </div>
              }
            />
            <StatMetricCard
              title="Активность"
              value={stats.totalInteractions}
              sparklineData={activitySplitMode === 'total' ? messagePoints : undefined}
              multiLineData={activityMultiLine}
              lineColor="#10b981"
              gradientId="analyticsActivity"
              subtitle={weeklyMessages > 0 ? `+${weeklyMessages} за неделю` : undefined}
              secondarySubtitle={stats.avgInteractionsPerUser !== undefined ? `~${stats.avgInteractionsPerUser.toFixed(1)} среднее` : undefined}
              trend={weeklyMessages > 0 ? 'up' : 'neutral'}
              cumulative={activityMode === 'cumulative'}
              chartGranularity={msgGranularity}
              chartHeight={160}
              chartType={activityChartType}
              headerExtra={
                <div className="flex flex-wrap items-center gap-1">
                  <ActivityGranularitySelector value={msgGranularity} onChange={setMsgGranularity} />
                  <ChartModeToggle value={activityMode} onChange={setActivityMode} />
                  <ChartTypeToggle value={activityChartType} onChange={setActivityChartType} />
                  <ActivitySplitToggle value={activitySplitMode} onChange={setActivitySplitMode} />
                </div>
              }
            />
          </div>

          {/* Строка 2: источники трафика (bar/line) + donut источников */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <AnalyticsSourcesChart
              projectId={projectId}
              selectedTokenId={selectedTokenId}
            />
            <StatDonutCard title="Источники трафика" items={sourceItems} maxItems={null} className="h-full" />
          </div>

          {/* Строка: топ-10 популярных кнопок */}
          <div className="grid grid-cols-1 gap-3">
            <AnalyticsPopularButtonsChart projectId={projectId} selectedTokenId={selectedTokenId} />
          </div>

          {/* Строка 3: Premium + языки */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <StatDonutCard title="Premium" items={statusItems} className="h-full" />
            <StatDonutCard title="Языки" items={languageItems} className="h-full" />
          </div>

          {/* Строка: конструктор графика по таблице */}
          <div className="grid grid-cols-1 gap-3">
            <AnalyticsTableChartCard projectId={projectId} />
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
