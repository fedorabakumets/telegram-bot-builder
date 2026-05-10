/**
 * @fileoverview Панель аналитики — статистика и рост аудитории бота
 * @description Отображает числовые карточки, график прироста и donut-диаграммы
 */

import React, { useState } from 'react';
import { BarChart2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useProjectTokens } from '@/hooks/use-project-tokens';
import { useStats } from '@/components/editor/database/user-database/hooks/queries/use-stats';
import { useGrowth, GrowthGranularity } from '@/components/editor/database/user-database/hooks/queries/use-growth';
import { useGrowthBySource } from '@/components/editor/database/user-database/hooks/queries/use-growth-by-source';
import { useTraffic } from '@/components/editor/database/user-database/hooks/queries/use-traffic';
import { useMessagesActivity, Granularity } from '@/components/editor/database/user-database/hooks/queries/use-messages-activity';
import { StatMetricCard, StatDonutCard } from '@/components/editor/database/user-database/components/stats';
import { ActivityGranularitySelector } from '@/components/editor/database/user-database/components/stats/activity-granularity-selector';
import { ChartModeToggle, ChartMode } from '@/components/editor/database/user-database/components/stats/chart-mode-toggle';
import { SourceMode } from '@/components/editor/database/user-database/components/stats/source-mode-toggle';
import { aggregateTopSources } from '@/components/editor/database/user-database/components/stats/source-aggregation-utils';
import { BotTokenSelector } from '@/components/editor/database/user-database/components/header/bot-token-selector';
import { AnalyticsGrowthSection } from './analytics-growth-section';

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
 * Панель аналитики: числовые карточки, график прироста, donut-диаграммы
 * @param props - Пропсы компонента
 * @returns JSX элемент панели аналитики
 */
export function AnalyticsPanel({ projectId, selectedTokenId, onSelectToken: _onSelectToken }: AnalyticsPanelProps): React.JSX.Element {
  /** Гранулярность графика прироста */
  const [growthGranularity, setGrowthGranularity] = useState<GrowthGranularity>('1d');
  /** Гранулярность графика активности */
  const [msgGranularity, setMsgGranularity] = useState<Granularity>('1d');
  /** Режим графика прироста */
  const [growthMode, setGrowthMode] = useState<ChartMode>('period');
  /** Режим отображения источников */
  const [sourceMode, setSourceMode] = useState<SourceMode>('total');

  const { stats, refetchStats } = useStats({ projectId, selectedTokenId });
  const { points: growthPoints, weeklyGrowth } = useGrowth({ projectId, selectedTokenId, granularity: growthGranularity });
  const { points: sourcePoints } = useGrowthBySource({ projectId, selectedTokenId, granularity: growthGranularity });
  const { sources, languages } = useTraffic({ projectId, selectedTokenId });
  const { points: messagePoints } = useMessagesActivity({ projectId, selectedTokenId, granularity: msgGranularity });

  const total = stats.totalUsers ?? 0;
  const growthTrend = weeklyGrowth > 0 ? 'up' : weeklyGrowth < 0 ? 'down' : 'neutral';
  const multiLineData = aggregateTopSources(sourcePoints, 5);

  /** Элементы для donut-карточки источников трафика */
  const sourceItems = sources.map(s => ({ label: s.param, count: s.count, percentage: s.percentage }));
  /** Элементы для donut-карточки языков */
  const languageItems = languages.map(l => ({ label: l.code, count: l.count, percentage: l.percentage }));
  /** Элементы для donut-карточки статуса */
  const statusItems = [
    { label: 'Активны',  count: stats.activeUsers ?? 0,  percentage: pct(stats.activeUsers ?? 0, total) },
    { label: 'Заблок.',  count: stats.blockedUsers ?? 0,  percentage: pct(stats.blockedUsers ?? 0, total) },
    { label: 'Premium',  count: stats.premiumUsers ?? 0,  percentage: pct(stats.premiumUsers ?? 0, total) },
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
          {/* Строка 1 — 4 числовые карточки */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatMetricCard
              title="Всего пользователей"
              value={stats.totalUsers}
              sparklineData={growthPoints}
              trend={growthTrend}
              subtitle={weeklyGrowth > 0 ? `+${weeklyGrowth} за неделю` : undefined}
            />
            <StatMetricCard
              title="Активность"
              value={stats.totalInteractions}
              sparklineData={messagePoints}
              lineColor="#10b981"
              gradientId="analyticsActivity"
              subtitle={stats.avgInteractionsPerUser !== undefined ? `~${stats.avgInteractionsPerUser.toFixed(1)} среднее` : undefined}
              headerExtra={<ActivityGranularitySelector value={msgGranularity} onChange={setMsgGranularity} />}
            />
            <StatMetricCard
              title="Активных"
              value={stats.activeUsers}
              subtitle={`${pct(stats.activeUsers ?? 0, total)}% от всех`}
            />
            <StatMetricCard
              title="Premium"
              value={stats.premiumUsers}
              subtitle={`${pct(stats.premiumUsers ?? 0, total)}% от всех`}
            />
          </div>

          {/* Строка 2 — Большой график прироста */}
          <AnalyticsGrowthSection
            growthPoints={growthPoints}
            multiLineData={multiLineData}
            granularity={growthGranularity}
            onGranularityChange={setGrowthGranularity}
            chartMode={growthMode}
            onChartModeChange={setGrowthMode}
            sourceMode={sourceMode}
            onSourceModeChange={setSourceMode}
          />

          {/* Строка 3 — 3 donut-карточки */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <StatDonutCard
              title="Источники трафика"
              items={sourceItems}
              onItemClick={(label) => console.log('Источник:', label)}
            />
            <StatDonutCard title="Языки" items={languageItems} />
            <StatDonutCard title="Статус" items={statusItems} />
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
