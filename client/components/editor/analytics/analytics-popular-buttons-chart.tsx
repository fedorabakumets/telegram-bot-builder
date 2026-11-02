/**
 * @fileoverview Карточка-график «Топ-10 самых популярных кнопок»
 * @description Горизонтальный bar chart нажатий inline-кнопок с переключателем
 *              периодов и WS real-time обновлениями.
 */

import { AnalyticsPeriodControl } from './analytics-chart-controls';
import { AnalyticsChartState } from './analytics-chart-state';
import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  ResponsiveContainer,
  BarChart, Bar,
  XAxis, YAxis, Tooltip, LabelList,
} from 'recharts';
import { GrowthGranularity } from '@/components/editor/database/user-database/hooks/queries/use-growth';
import { usePopularButtons } from '@/components/editor/database/user-database/hooks/queries/use-popular-buttons';
import { useUserMessagesLiveContext } from '@/components/editor/database/user-database/contexts/user-messages-live-context';
import { PopularButtonsTooltip } from './analytics-popular-buttons-tooltip';
import { PopularButtonsChartInfo } from './analytics-chart-info-texts';

/**
 * Пропсы компонента AnalyticsPopularButtonsChart
 */
export interface AnalyticsPopularButtonsChartProps {
  /** Идентификатор проекта */
  projectId: number;
  /** Идентификатор выбранного токена бота */
  selectedTokenId?: number | null;
}

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
    <div className="analytics-card bg-background border rounded-xl p-4 flex flex-col gap-4">
      {/* Заголовок + переключатель периодов */}
      <div className="analytics-card-heading flex flex-col gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <h4 className="text-base font-semibold">Топ кнопок</h4>
          {totalForPeriod > 0 && (
            <span className="text-xs text-muted-foreground whitespace-nowrap">{totalForPeriod.toLocaleString('ru-RU')} нажатий в топе</span>
          )}
        </div>
        <AnalyticsPeriodControl value={granularity} onChange={setGranularity} />
      </div>


      {/* Горизонтальный bar chart или пустое состояние */}
      {items.length === 0 ? (
        <AnalyticsChartState loading={isLoading} title="Пока нет нажатий" description="Здесь появятся популярные кнопки, когда пользователи начнут их нажимать." />
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(160, items.length * 40)}>
          <BarChart data={items} layout="vertical" margin={{ top: 4, right: 48, bottom: 0, left: 4 }}>
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="label" width={144}
              tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
              axisLine={false} tickLine={false}
              tickFormatter={(v: string) => v.length > 18 ? v.slice(0, 17) + '…' : v} />
            <Tooltip
              content={(props) => (
                <PopularButtonsTooltip active={props.active} payload={props.payload as any} />
              )}
              cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
            <Bar dataKey="count" fill="#10b981" fillOpacity={0.85}
              radius={[0, 4, 4, 0]} isAnimationActive={false}>
              <LabelList dataKey="count" position="right" fill="var(--foreground)" fontSize={12} formatter={(value: number) => value.toLocaleString('ru-RU')} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
      <PopularButtonsChartInfo />
    </div>
  );
}
