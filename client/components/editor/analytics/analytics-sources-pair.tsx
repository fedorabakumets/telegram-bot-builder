/**
 * @fileoverview Пара «Источники трафика»: общий срок, столбцы и кольцо
 * @module client/components/editor/analytics/analytics-sources-pair
 */

import React, { useMemo, useRef, useState } from 'react';
import { useSourcesCardAlignment } from './use-sources-card-alignment';
import './analytics-sources-layout.css';
import { useGrowthBySource } from '@/components/editor/database/user-database/hooks/queries/use-growth-by-source';
import { useTraffic } from '@/components/editor/database/user-database/hooks/queries/use-traffic';
import { StatDonutCard } from '@/components/editor/database/user-database/components/stats';
import { AnalyticsSourcesChart } from './analytics-sources-chart';
import { AnalyticsSourcesPeriodControl } from './analytics-chart-controls';
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
 * Показывает согласованные карточки источников с подписанными периодами
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
  const pairRef = useRef<HTMLDivElement>(null);
  useSourcesCardAlignment(pairRef);
  const windowed = isSourcesWindow(period);

  const { points } = useGrowthBySource({
    projectId,
    selectedTokenId,
    granularity: period,
  });
  const { sources } = useTraffic({ projectId, selectedTokenId });

  const periodItems = useMemo(() => growthPointsToSourceItems(points), [points]);
  const allItems = useMemo(() => trafficSourcesToItems(sources), [sources]);

  return (
    <div ref={pairRef} className={`analytics-sources-pair grid gap-4 ${gridClassName}`}>
      <AnalyticsSourcesChart
        projectId={projectId}
        selectedTokenId={selectedTokenId}
        granularity={period}
        showSeries
        period={period}
        onPeriodChange={setPeriod}
      />
      <StatDonutCard
        title="Распределение по источникам"
        subtitle={SOURCES_PERIOD_CAPTIONS[period]}
        items={windowed ? periodItems : allItems}
        maxItems={null}
        className="analytics-source-distribution h-full"
        legendHeader={<div className="analytics-sources-list-heading text-xs text-muted-foreground">Источники · {(windowed ? periodItems : allItems).length}<span>Пользователи и доля</span></div>}
        info={donutInfo}
        onItemClick={onSourceClick}
        headerExtra={
          <AnalyticsSourcesPeriodControl value={period} onChange={setPeriod} />
        }
      />
    </div>
  );
}
