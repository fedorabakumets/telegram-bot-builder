/**
 * @fileoverview Главный дашборд статистики пользователей
 * @description Сетка из числовых карточек и карточек с барами
 */

import React, { useState } from 'react';
import { UserStats } from '../../types';
import { useGrowth } from '../../hooks/queries/use-growth';
import { useTraffic } from '../../hooks/queries/use-traffic';
import { useMessagesActivity, Granularity } from '../../hooks/queries/use-messages-activity';
import { StatMetricCard } from './stat-metric-card';
import { StatBarCard } from './stat-bar-card';
import { ActivityGranularitySelector } from './activity-granularity-selector';

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

  const { points, weeklyGrowth } = useGrowth({ projectId, selectedTokenId });
  const { sources, languages } = useTraffic({ projectId, selectedTokenId });
  const { points: messagePoints, weeklyMessages } = useMessagesActivity({
    projectId,
    selectedTokenId,
    granularity: msgGranularity,
  });

  // Определяем тренд по недельному приросту
  const growthTrend = weeklyGrowth > 0 ? 'up' : weeklyGrowth < 0 ? 'down' : 'neutral';

  // Вычисляем проценты статусов пользователей от общего числа
  const total = stats.totalUsers ?? 0;
  const activePercent = calcPercent(stats.activeUsers ?? 0, total);
  const blockedPercent = calcPercent(stats.blockedUsers ?? 0, total);
  const premiumPercent = calcPercent(stats.premiumUsers ?? 0, total);

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
  const activitySubtitle = [
    stats.avgInteractionsPerUser !== undefined
      ? `${formatAvg(stats.avgInteractionsPerUser)} / юзер`
      : null,
    stats.usersWithResponses ? `${stats.usersWithResponses} с ответами` : null,
  ].filter(Boolean).join(' · ') || undefined;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3">
      {/* Карточка: всего пользователей со sparkline */}
      <StatMetricCard
        title="Всего пользователей"
        value={stats.totalUsers}
        sparklineData={points}
        trend={growthTrend}
        subtitle={weeklyGrowth > 0 ? `+${weeklyGrowth} за неделю` : undefined}
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
        headerExtra={
          <ActivityGranularitySelector
            value={msgGranularity}
            onChange={setMsgGranularity}
          />
        }
      />

      {/* Карточка: статус пользователей (активные, заблокированные, premium) */}
      <StatBarCard
        title="Статус"
        items={[
          { label: 'Активны', count: stats.activeUsers ?? 0, percentage: activePercent },
          { label: 'Заблок.', count: stats.blockedUsers ?? 0, percentage: blockedPercent },
          { label: 'Premium', count: stats.premiumUsers ?? 0, percentage: premiumPercent },
        ]}
      />

      {/* Карточка: источники трафика — StatBarCard сам скрывается при пустом массиве */}
      <StatBarCard
        title="Источники трафика"
        items={sourceItems}
        onItemClick={onSourceClick}
      />

      {/* Карточка: языки — StatBarCard сам скрывается при пустом массиве */}
      <StatBarCard
        title="Языки"
        items={languageItems}
      />
    </div>
  );
}
