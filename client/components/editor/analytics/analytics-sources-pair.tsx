/**
 * @fileoverview Пара «Источники трафика»: общий срок, столбцы и кольцо
 * @module client/components/editor/analytics/analytics-sources-pair
 */

import React, { useMemo, useState } from 'react';
import { useGrowthBySource } from '@/components/editor/database/user-database/hooks/queries/use-growth-by-source';
import { useTraffic } from '@/components/editor/database/user-database/hooks/queries/use-traffic';
import { StatDonutCard } from '@/components/editor/database/user-database/components/stats';
import { AnalyticsSourcesChart } from './analytics-sources-chart';
import { SourcesPeriodSelector } from './sources-period-selector';
import { SourcesPeriod, SOURCES_PERIOD_CAPTIONS, isSourcesWindow } from './sources-period';
import { growthPointsToSourceItems, trafficSourcesToItems } from './sources-donut-items';

/**
 * Пропсы пары карточек источников трафика
 */
export interface AnalyticsSourcesPairProps {
  /** Идентификатор проекта */
  projectId: number;
  /** Идентификатор выбранного токена бота */
  selectedTokenId?: number | null;
  /** Клик по источнику в легенде кольца */
  onSourceClick?: (source: string) => void;
  /** Пояснение кольца */
  donutInfo?: React.ReactNode;
  /** Классы сетки двух карточек */
  gridClassName?: string;
}

/**
 * Столбцы и кольцо с одним переключателем срока
 * @param props - Пропсы компонента
 * @returns JSX элемент пары
 */
export function AnalyticsSourcesPair({
  projectId,
  selectedTokenId,
  onSourceClick,
  donutInfo,
  gridClassName = 'grid-cols-1 lg:grid-cols-2',
}: AnalyticsSourcesPairProps): React.JSX.Element {
  const [period, setPeriod] = useState<SourcesPeriod>('1d');
  const windowed = isSourcesWindow(period);

  const { points } = useGrowthBySource({
    projectId,
    selectedTokenId,
    granularity: windowed ? period : '1d',
    enabled: windowed,
  });
  const { sources } = useTraffic({ projectId, selectedTokenId });

  const periodItems = useMemo(() => growthPointsToSourceItems(points), [points]);
  const allItems = useMemo(() => trafficSourcesToItems(sources), [sources]);

  return (
    <div className={`grid gap-3 ${gridClassName}`}>
      <AnalyticsSourcesChart
        projectId={projectId}
        selectedTokenId={selectedTokenId}
        granularity={windowed ? period : '1d'}
        showSeries={windowed}
        period={period}
        onPeriodChange={setPeriod}
      />
      <StatDonutCard
        title="Источники трафика"
        subtitle={SOURCES_PERIOD_CAPTIONS[period]}
        items={windowed ? periodItems : allItems}
        maxItems={null}
        className="h-full"
        info={donutInfo}
        onItemClick={onSourceClick}
        headerExtra={
          <SourcesPeriodSelector value={period} onChange={setPeriod} />
        }
      />
    </div>
  );
}
