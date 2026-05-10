/**
 * @fileoverview Панель аналитики — статистика и рост аудитории бота
 * @description Отображает числовые карточки с графиками и donut-диаграммы
 */

import React, { useState } from 'react';
import { BarChart2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useStats } from '@/components/editor/database/user-database/hooks/queries/use-stats';
import { useGrowth, GrowthGranularity } from '@/components/editor/database/user-database/hooks/queries/use-growth';
import { useGrowthBySource } from '@/components/editor/database/user-database/hooks/queries/use-growth-by-source';
import { useTraffic } from '@/components/editor/database/user-database/hooks/queries/use-traffic';
import { useMessagesActivity, Granularity } from '@/components/editor/database/user-database/hooks/queries/use-messages-activity';
import { StatMetricCard, StatDonutCard } from '@/components/editor/database/user-database/components/stats';
import { ActivityGranularitySelector } from '@/components/editor/database/user-database/components/stats/activity-granularity-selector';
import { GrowthGranularitySelector } from '@/components/editor/database/user-database/components/stats/growth-granularity-selector';
import { ChartModeToggle, ChartMode } from '@/components/editor/database/user-database/components/stats/chart-mode-toggle';
import { SourceModeToggle, SourceMode } from '@/components/editor/database/user-database/components/stats/source-mode-toggle';
import { aggregateTopSources } from '@/components/editor/database/user-database/components/stats/source-aggregation-utils';

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
export function AnalyticsPanel({ projectId, selectedTokenId, onSelectToken: _onSelectToken }: AnalyticsPanelProps): React.JSX.Element {
  /** Гранулярность графика прироста */
  const [growthGranularity, setGrowthGranularity] = useState<GrowthGranularity>('1d');
  /** Гранулярность графика активности */
  const [msgGranularity, setMsgGranularity] = useState<Granularity>('1d');
  /** Режим графика прироста: за период или накопительно */
  const [growthMode, setGrowthMode] = useState<ChartMode>('period');
  /** Режим графика активности: за период или накопительно */
  const [activityMode, setActivityMode] = useState<ChartMode>('period');
  /** Режим отображения источников: общий или по источникам */
  const [sourceMode, setSourceMode] = useState<SourceMode>('total');

  const { stats, refetchStats } = useStats({ projectId, selectedTokenId });
  const { points: growthPoints, weeklyGrowth } = useGrowth({ projectId, selectedTokenId, granularity: growthGranularity });
  const { points: sourcePoints } = useGrowthBySource({ projectId, selectedTokenId, granularity: growthGranularity });
  const { sources, languages } = useTraffic({ projectId, selectedTokenId });
  const { points: messagePoints, weeklyMessages } = useMessagesActivity({ projectId, selectedTokenId, granularity: msgGranularity });

  const total = stats.totalUsers ?? 0;
  const growthTrend = weeklyGrowth > 0 ? 'up' : weeklyGrowth < 0 ? 'down' : 'neutral';
  const multiLineData = aggregateTopSources(sourcePoints, 5);

  /** Элементы для donut-карточки источников трафика */
  const sourceItems = sources.map(s => ({ label: s.param, count: s.count, percentage: s.percentage }));
  /** Элементы для donut-карточки языков */
  const languageItems = languages.map(l => ({ label: l.code, count: l.count, percentage: l.percentage }));
  /** Элементы для donut-карточки статуса */
  const statusItems = [
    { label: 'Активны', count: stats.activeUsers ?? 0, percentage: pct(stats.activeUsers ?? 0, total) },
    { label: 'Заблок.', count: stats.blockedUsers ?? 0, percentage: pct(stats.blockedUsers ?? 0, total) },
    { label: 'Premium', count: stats.premiumUsers ?? 0, percentage: pct(stats.premiumUsers ?? 0, total) },
  ];

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Шапка */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-muted/40 to-background">
        <div className="flex items-center gap-2.5">
          <div className="rounded-lg bg-primary/10 p-2">
            <BarChart2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-semibold leading-none">Аналитика</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Статистика и рост аудитории</p>
          </div>
        </div>
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => refetchStats()}>
          <RefreshCw className="h-4 w-4" />
          Обновить
        </Button>
      </div>

      {/* Контент */}
      <ScrollArea className="flex-1">
        <div className="p-4 flex flex-col gap-4">
          {/* 2 числовые карточки */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <StatMetricCard
              title="Всего пользователей"
              value={stats.totalUsers}
              sparklineData={sourceMode === 'total' ? growthPoints : undefined}
              multiLineData={sourceMode === 'by-source' ? multiLineData : undefined}
              trend={growthTrend}
              subtitle={weeklyGrowth > 0 ? `+${weeklyGrowth} за неделю` : undefined}
              cumulative={growthMode === 'cumulative'}
              chartGranularity={growthGranularity}
              headerExtra={
                <div className="flex items-center gap-1.5">
                  <GrowthGranularitySelector value={growthGranularity} onChange={setGrowthGranularity} />
                  <ChartModeToggle value={growthMode} onChange={setGrowthMode} />
                  <SourceModeToggle value={sourceMode} onChange={setSourceMode} />
                </div>
              }
            />
            <StatMetricCard
              title="Активность"
              value={stats.totalInteractions}
              sparklineData={messagePoints}
              lineColor="#10b981"
              gradientId="analyticsActivity"
              subtitle={stats.avgInteractionsPerUser !== undefined ? `~${stats.avgInteractionsPerUser.toFixed(1)} среднее` : undefined}
              trend={weeklyMessages > 0 ? 'up' : 'neutral'}
              cumulative={activityMode === 'cumulative'}
              chartGranularity={msgGranularity}
              headerExtra={
                <div className="flex items-center gap-1.5">
                  <ActivityGranularitySelector value={msgGranularity} onChange={setMsgGranularity} />
                  <ChartModeToggle value={activityMode} onChange={setActivityMode} />
                </div>
              }
            />
          </div>

          {/* 3 donut-карточки */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <StatDonutCard title="Источники трафика" items={sourceItems} />
            <StatDonutCard title="Языки" items={languageItems} />
            <StatDonutCard title="Статус" items={statusItems} />
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
