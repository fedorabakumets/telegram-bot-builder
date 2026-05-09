/**
 * @fileoverview Секция графика прироста пользователей для панели аналитики
 * @description Большой график с переключателями гранулярности, режима и источников
 */

import React from 'react';
import { GrowthPoint, GrowthGranularity } from '@/components/editor/database/user-database/hooks/queries/use-growth';
import { GrowthGranularitySelector } from '@/components/editor/database/user-database/components/stats';
import { ChartModeToggle, ChartMode } from '@/components/editor/database/user-database/components/stats/chart-mode-toggle';
import { SourceModeToggle, SourceMode } from '@/components/editor/database/user-database/components/stats/source-mode-toggle';
import { SourceLegend } from '@/components/editor/database/user-database/components/stats/source-legend';
import { SparklineChart } from '@/components/editor/database/user-database/components/stats/sparkline-chart';
import { MultiLineData } from '@/components/editor/database/user-database/components/stats/source-aggregation-utils';

/**
 * Пропсы секции графика прироста
 */
export interface AnalyticsGrowthSectionProps {
  /** Точки прироста для single-line режима */
  growthPoints: GrowthPoint[];
  /** Данные по источникам для multi-line режима */
  multiLineData: MultiLineData[];
  /** Текущая гранулярность */
  granularity: GrowthGranularity;
  /** Обработчик смены гранулярности */
  onGranularityChange: (g: GrowthGranularity) => void;
  /** Режим графика: за период / накопительно */
  chartMode: ChartMode;
  /** Обработчик смены режима графика */
  onChartModeChange: (m: ChartMode) => void;
  /** Режим источников: общий / по источникам */
  sourceMode: SourceMode;
  /** Обработчик смены режима источников */
  onSourceModeChange: (m: SourceMode) => void;
}

/**
 * Секция большого графика прироста пользователей с переключателями
 * @param props - Пропсы компонента
 * @returns JSX элемент секции графика
 */
export function AnalyticsGrowthSection(props: AnalyticsGrowthSectionProps): React.JSX.Element {
  const {
    growthPoints,
    multiLineData,
    granularity,
    onGranularityChange,
    chartMode,
    onChartModeChange,
    sourceMode,
    onSourceModeChange,
  } = props;

  /** Данные для графика в зависимости от режима источников */
  const sparklineData = sourceMode === 'total' ? growthPoints : undefined;
  const multiLine = sourceMode === 'by-source' ? multiLineData : undefined;

  return (
    <div className="bg-background border rounded-xl p-4 flex flex-col gap-3">
      {/* Заголовок с переключателями */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-sm font-semibold text-foreground">Прирост пользователей</p>
        <div className="flex items-center gap-1.5 flex-wrap">
          <SourceModeToggle value={sourceMode} onChange={onSourceModeChange} />
          <GrowthGranularitySelector value={granularity} onChange={onGranularityChange} />
          <ChartModeToggle value={chartMode} onChange={onChartModeChange} />
        </div>
      </div>

      {/* График */}
      <div className="h-[120px] [&_.recharts-responsive-container]:!h-full">
        <SparklineChart
          data={sparklineData}
          multiLineData={multiLine}
          gradientId="analyticsGrowth"
          granularity={granularity}
          cumulative={chartMode === 'cumulative'}
        />
      </div>

      {/* Легенда для режима по источникам */}
      {sourceMode === 'by-source' && multiLineData.length > 0 && (
        <SourceLegend items={multiLineData} />
      )}
    </div>
  );
}
