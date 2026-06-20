/**
 * @fileoverview Карточка-график «Топ-10 самых популярных кнопок»
 * @description Горизонтальный bar chart нажатий inline-кнопок с переключателем
 *              периодов и WS real-time обновлениями.
 */

import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  ResponsiveContainer,
  BarChart, Bar,
  XAxis, YAxis, Tooltip,
} from 'recharts';
import { GrowthGranularity } from '@/components/editor/database/user-database/hooks/queries/use-growth';
import { usePopularButtons } from '@/components/editor/database/user-database/hooks/queries/use-popular-buttons';
import { useUserMessagesLiveContext } from '@/components/editor/database/user-database/contexts/user-messages-live-context';
import { PopularButtonsTooltip } from './analytics-popular-buttons-tooltip';

/**
 * Пропсы компонента AnalyticsPopularButtonsChart
 */
export interface AnalyticsPopularButtonsChartProps {
  /** Идентификатор проекта */
  projectId: number;
  /** Идентификатор выбранного токена бота */
  selectedTokenId?: number | null;
}

/** Метки кнопок переключателя периодов */
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
 * Карточка-график топ-10 популярных кнопок с переключателем периодов
 * и WS real-time обновлениями.
 * @param props - Свойства компонента
 * @returns JSX элемент карточки
 */
export function AnalyticsPopularButtonsChart({ projectId, selectedTokenId }: AnalyticsPopularButtonsChartProps): React.JSX.Element {
  /** Текущая гранулярность графика */
  const [granularity, setGranularity] = useState<GrowthGranularity>('1d');

  const queryClient = useQueryClient();
  const liveContext = useUserMessagesLiveContext();

  /** Подписка на WS-событие new-message — инвалидация кэша популярных кнопок */
  useEffect(() => {
    if (!liveContext) return;
    return liveContext.subscribe((event) => {
      if (event.type === 'new-message' && event.projectId === projectId) {
        queryClient.invalidateQueries({ queryKey: ['popular-buttons', projectId, selectedTokenId] });
      }
    });
  }, [liveContext, projectId, selectedTokenId, queryClient]);

  const { items, isLoading } = usePopularButtons({ projectId, selectedTokenId, granularity });

  /** Суммарное число нажатий за период */
  const totalForPeriod = items.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="bg-background border rounded-xl p-3 flex flex-col gap-3">
      {/* Заголовок + переключатель периодов */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-medium truncate">Топ кнопок</span>
          {totalForPeriod > 0 && (
            <span className="text-xs text-muted-foreground whitespace-nowrap">{totalForPeriod} нажатий за период</span>
          )}
        </div>
        <div className="flex items-center gap-0.5 flex-wrap">
          {PERIOD_ORDER.map((g) => (
            <button key={g} type="button" onClick={() => setGranularity(g)}
              className={['text-xs px-1.5 py-0.5 rounded transition-colors',
                g === granularity ? 'bg-primary/20 text-primary font-medium' : 'text-muted-foreground hover:text-foreground',
              ].join(' ')}>
              {PERIOD_LABELS[g]}
            </button>
          ))}
        </div>
      </div>

      {/* Горизонтальный bar chart или пустое состояние */}
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground/50 italic py-8 text-center">
          {isLoading ? '' : 'Нет данных о нажатиях кнопок'}
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(160, items.length * 32)}>
          <BarChart data={items} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 4 }}>
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="label" width={120}
              tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.6)' }}
              axisLine={false} tickLine={false}
              tickFormatter={(v: string) => v.length > 18 ? v.slice(0, 17) + '…' : v} />
            <Tooltip
              content={(props) => (
                <PopularButtonsTooltip active={props.active} payload={props.payload as any} />
              )}
              cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
            <Bar dataKey="count" fill="#10b981" fillOpacity={0.85}
              radius={[0, 4, 4, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
