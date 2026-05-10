/**
 * @fileoverview Карточка-график динамики источников трафика
 * @description Отображает multi-line график с переключателем периодов,
 *              интерактивной легендой и WS real-time обновлениями.
 */

import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { GrowthGranularity } from '@/components/editor/database/user-database/hooks/queries/use-growth';
import { useGrowthBySource } from '@/components/editor/database/user-database/hooks/queries/use-growth-by-source';
import { aggregateTopSources } from '@/components/editor/database/user-database/components/stats/source-aggregation-utils';
import { SparklineChart } from '@/components/editor/database/user-database/components/stats/sparkline-chart';
import { useUserMessagesLiveContext } from '@/components/editor/database/user-database/contexts/user-messages-live-context';

/**
 * Пропсы компонента AnalyticsSourcesChart
 */
export interface AnalyticsSourcesChartProps {
  /** Идентификатор проекта */
  projectId: number;
  /** Идентификатор выбранного токена бота */
  selectedTokenId?: number | null;
}

/**
 * Метки кнопок переключателя периодов
 */
const PERIOD_LABELS: Record<GrowthGranularity, string> = {
  '1m':  '1ч',
  '5m':  '3ч',
  '1h':  '24ч',
  '1d':  '30д',
  '7d':  '12н',
  '30d': '12м',
};

/** Порядок кнопок переключателя */
const PERIOD_ORDER: GrowthGranularity[] = ['1m', '5m', '1h', '1d', '7d', '30d'];

/**
 * Карточка-график динамики источников трафика с переключателем периодов,
 * интерактивной легендой и WS real-time обновлениями.
 * @param props - Свойства компонента
 * @returns JSX элемент карточки
 */
export function AnalyticsSourcesChart({ projectId, selectedTokenId }: AnalyticsSourcesChartProps): React.JSX.Element {
  /** Текущая гранулярность графика */
  const [granularity, setGranularity] = useState<GrowthGranularity>('1d');
  /** Множество скрытых источников (по имени) */
  const [hiddenSources, setHiddenSources] = useState<Set<string>>(new Set());

  const queryClient = useQueryClient();
  const liveContext = useUserMessagesLiveContext();

  /** Подписка на WS-событие new-user — инвалидация кэша источников */
  useEffect(() => {
    if (!liveContext) return;
    return liveContext.subscribe((event) => {
      if (event.type === 'new-user' && event.projectId === projectId) {
        queryClient.invalidateQueries({
          queryKey: ['users-growth-by-source', projectId, selectedTokenId],
        });
      }
    });
  }, [liveContext, projectId, selectedTokenId, queryClient]);

  const { points, isLoading } = useGrowthBySource({ projectId, selectedTokenId, granularity });
  const multiLineData = aggregateTopSources(points, 6);

  /** Суммарное число пользователей за период по всем источникам */
  const totalForPeriod = multiLineData.reduce(
    (sum, line) => sum + line.data.reduce((s, p) => s + p.count, 0),
    0,
  );

  /** Данные только видимых источников (не скрытых легендой) */
  const visibleData = multiLineData.filter(d => !hiddenSources.has(d.name));

  /**
   * Переключает видимость источника в легенде
   * @param name - Название источника
   */
  function toggleSource(name: string): void {
    setHiddenSources(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  return (
    <div className="bg-background border rounded-xl p-3 flex flex-col gap-3">
      {/* Заголовок + переключатель периодов */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Источники трафика</span>
          {totalForPeriod > 0 && (
            <span className="text-xs text-muted-foreground">+{totalForPeriod} за период</span>
          )}
        </div>
        <div className="flex items-center gap-0.5">
          {PERIOD_ORDER.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGranularity(g)}
              className={[
                'text-xs px-1.5 py-0.5 rounded transition-colors',
                g === granularity
                  ? 'bg-primary/20 text-primary font-medium'
                  : 'text-muted-foreground hover:text-foreground',
              ].join(' ')}
            >
              {PERIOD_LABELS[g]}
            </button>
          ))}
        </div>
      </div>

      {/* График или пустое состояние */}
      {multiLineData.length === 0 && !isLoading ? (
        <p className="text-xs text-muted-foreground/50 italic py-8 text-center">
          Нет данных об источниках трафика
        </p>
      ) : (
        <SparklineChart
          multiLineData={visibleData}
          gradientId="sourcesChart"
          granularity={granularity}
          height={160}
        />
      )}

      {/* Интерактивная легенда — pill-кнопки */}
      {multiLineData.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {multiLineData.map((line) => {
            const hidden = hiddenSources.has(line.name);
            const count = line.data.reduce((s, p) => s + p.count, 0);
            return (
              <button
                key={line.name}
                type="button"
                onClick={() => toggleSource(line.name)}
                className={[
                  'flex items-center gap-1.5 px-2 py-1 rounded-full border text-xs font-medium transition-all',
                  hidden
                    ? 'border-border/40 text-muted-foreground/50 bg-transparent line-through'
                    : 'border-transparent text-foreground',
                ].join(' ')}
                style={hidden ? {} : {
                  backgroundColor: `${line.color}18`,
                  borderColor: `${line.color}50`,
                }}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0 transition-colors"
                  style={{ backgroundColor: hidden ? '#6b7280' : line.color }}
                />
                {line.name}
                <span className="tabular-nums opacity-70">{count}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
