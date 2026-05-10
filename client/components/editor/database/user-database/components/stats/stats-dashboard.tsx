/**
 * @fileoverview Главный дашборд статистики пользователей
 * @description Сетка из числовых карточек и карточек с барами
 */

import React, { useState } from 'react';
import { UserStats } from '../../types';
import { useGrowth, GrowthGranularity } from '../../hooks/queries/use-growth';
import { useGrowthBySource } from '../../hooks/queries/use-growth-by-source';
import { useTraffic } from '../../hooks/queries/use-traffic';
import { useMessagesActivity, Granularity } from '../../hooks/queries/use-messages-activity';
import { StatMetricCard } from './stat-metric-card';
import { StatDonutCard } from './stat-donut-card';
import { ActivityGranularitySelector } from './activity-granularity-selector';
import { GrowthGranularitySelector } from './growth-granularity-selector';
import { ChartModeToggle, ChartMode } from './chart-mode-toggle';
import { ChartTypeToggle, ChartType } from './chart-type-toggle';
import { SourceModeToggle, SourceMode } from './source-mode-toggle';
import { aggregateTopSources } from './source-aggregation-utils';

/**
 * Пропсы компонента StatsDashboard
 */
export interface StatsDashboardProps {
  /** Статистика пользователей */
  stats: UserStats;
  /** Идентификатор проекта */
  projectId: number;
  /** Идентификатор выбранного токена бота */
  selectedTokenId?: number | null;
  /** Обработчик клика по источнику трафика */
  onSourceClick?: (source: string) => void;
}

/**
 * Форматирует среднее значение взаимодействий
 * @param v - Числовое значение
 * @returns Строка с одним знаком после запятой
 */
function formatAvg(v: number): string {
  return v.toFixed(1);
}

/**
 * Вычисляет процент от общего числа пользователей
 * @param count - Количество пользователей в группе
 * @param total - Общее количество пользователей
 * @returns Процент от 0 до 100, или 0 если total равен нулю
 */
function calcPercent(count: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((count / total) * 100);
}

/**
 * Главный дашборд статистики: числовые карточки + бары источников и языков
 * @param props - Пропсы компонента
 * @returns JSX элемент дашборда
 */
export function StatsDashboard(props: StatsDashboardProps): React.JSX.Element {
  const { stats, projectId, selectedTokenId, onSourceClick } = props;

  /** Текущая гранулярность графика активности сообщений */
  const [msgGranularity, setMsgGranularity] = useState<Granularity>('1d');

  /** Текущая гранулярность графика прироста пользователей */
  const [growthGranularity, setGrowthGranularity] = useState<GrowthGranularity>('1d');

  /** Режим графика "Всего пользователей": за период или накопительно */
  const [growthMode, setGrowthMode] = useState<ChartMode>('period');

  /** Режим графика "Активность": за период или накопительно */
  const [activityMode, setActivityMode] = useState<ChartMode>('period');

  /** Тип графика прироста: столбчатый или линейный */
  const [growthChartType, setGrowthChartType] = useState<ChartType>('line');

  /** Тип графика активности: столбчатый или линейный */
  const [activityChartType, setActivityChartType] = useState<ChartType>('line');

  /** Режим отображения прироста: общий или по источникам */
  const [sourceMode, setSourceMode] = useState<SourceMode>('total');

  const { points, weeklyGrowth } = useGrowth({ projectId, selectedTokenId, granularity: growthGranularity });
  const { points: sourcePoints } = useGrowthBySource({ projectId, selectedTokenId, granularity: growthGranularity });
  const { sources, languages } = useTraffic({ projectId, selectedTokenId });
  const { points: messagePoints, weeklyMessages } = useMessagesActivity({
    projectId,
    selectedTokenId,
    granularity: msgGranularity,
  });

  // Определяем тренд по недельному приросту
  const growthTrend = weeklyGrowth > 0 ? 'up' : weeklyGrowth < 0 ? 'down' : 'neutral';

  // Вычисляем процент premium пользователей от общего числа
  const total = stats.totalUsers ?? 0;
  const premiumPercent = calcPercent(stats.premiumUsers ?? 0, total);
  const nonPremiumPercent = calcPercent(Math.max(0, total - (stats.premiumUsers ?? 0)), total);

  // Преобразуем источники трафика в формат StatBarItem
  const sourceItems = sources.map(s => ({
    label: s.param,
    count: s.count,
    percentage: s.percentage,
  }));

  // Преобразуем языки в формат StatBarItem
  const languageItems = languages.map(l => ({
    label: l.code,
    count: l.count,
    percentage: l.percentage,
  }));

  // Формируем подпись для карточки активности
  const activitySubtitle = stats.avgInteractionsPerUser !== undefined
    ? `~${formatAvg(stats.avgInteractionsPerUser)} среднее`
    : undefined;

  // Агрегируем данные по источникам для multi-line графика
  const multiLineData = sourceMode === 'by-source' ? aggregateTopSources(sourcePoints, 5) : undefined;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3">
      {/* Карточка: всего пользователей со sparkline */}
      <StatMetricCard
        title="Всего пользователей"
        value={stats.totalUsers}
        sparklineData={sourceMode === 'total' ? points : undefined}
        multiLineData={multiLineData}
        trend={growthTrend}
        subtitle={weeklyGrowth > 0 ? `+${weeklyGrowth} за неделю` : undefined}
        cumulative={growthMode === 'cumulative'}
        chartGranularity={growthGranularity}
        chartType={growthChartType}
        headerExtra={
          <div className="flex items-center gap-1.5">
            <GrowthGranularitySelector
              value={growthGranularity}
              onChange={setGrowthGranularity}
            />
            <ChartModeToggle value={growthMode} onChange={setGrowthMode} />
            <ChartTypeToggle value={growthChartType} onChange={setGrowthChartType} />
            <SourceModeToggle value={sourceMode} onChange={setSourceMode} />
          </div>
        }
      />

      {/* Карточка: активность с подписью среднего и числа ответивших */}
      <StatMetricCard
        title="Активность"
        value={stats.totalInteractions}
        sparklineData={messagePoints}
        subtitle={activitySubtitle}
        trend={weeklyMessages > 0 ? 'up' : 'neutral'}
        gradientId="msgActivity"
        lineColor="#10b981"
        chartGranularity={msgGranularity}
        cumulative={activityMode === 'cumulative'}
        chartType={activityChartType}
        headerExtra={
          <div className="flex items-center gap-1.5">
            <ActivityGranularitySelector
              value={msgGranularity}
              onChange={setMsgGranularity}
            />
            <ChartModeToggle value={activityMode} onChange={setActivityMode} />
            <ChartTypeToggle value={activityChartType} onChange={setActivityChartType} />
          </div>
        }
      />

      {/* Карточка: Premium / не Premium */}
      <StatDonutCard
        title="Premium"
        items={[
          { label: 'Premium', count: stats.premiumUsers ?? 0, percentage: premiumPercent },
          { label: 'Обычные', count: Math.max(0, total - (stats.premiumUsers ?? 0)), percentage: nonPremiumPercent },
        ]}
      />

      {/* Карточка: источники трафика */}
      <StatDonutCard
        title="Источники трафика"
        items={sourceItems}
        onItemClick={onSourceClick}
      />

      {/* Карточка: языки */}
      <StatDonutCard
        title="Языки"
        items={languageItems}
      />
    </div>
  );
}
