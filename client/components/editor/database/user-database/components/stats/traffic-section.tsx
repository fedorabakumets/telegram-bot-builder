/**
 * @fileoverview Компонент секции трафика и языков
 * @description Отображает строку со статистикой deep link / рефералов / языков
 * и кликабельные pill-теги источников трафика
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { useTraffic } from '../../hooks/queries/use-traffic';
import { UserStats } from '../../types';

/**
 * Пропсы компонента TrafficSection
 */
export interface TrafficSectionProps {
  /** Идентификатор проекта */
  projectId: number;
  /** Идентификатор выбранного токена бота */
  selectedTokenId?: number | null;
  /** Статистика пользователей (для deepLinkUsers, referralUsers, uniqueLanguages) */
  stats: UserStats;
  /** Обработчик клика по источнику трафика (для фильтрации таблицы) */
  onSourceClick?: (source: string) => void;
}

/**
 * Компонент секции трафика и языков
 * @param props - Пропсы компонента
 * @returns JSX элемент или null если данных нет
 */
export function TrafficSection(props: TrafficSectionProps): React.JSX.Element | null {
  const { projectId, selectedTokenId, stats, onSourceClick } = props;

  const { sources } = useTraffic({ projectId, selectedTokenId });

  const hasDeepLink = (stats.deepLinkUsers ?? 0) > 0;
  const hasLanguages = (stats.uniqueLanguages ?? 0) > 0;

  // Рендерим всегда — useTraffic должен быть смонтирован чтобы инвалидация работала.
  // Если данных нет — компонент просто ничего не показывает.
  if (!hasDeepLink && !hasLanguages && sources.length === 0) {
    return null;
  }

  return (
    <div className="px-3 pb-2 flex flex-col gap-1">
      <SummaryRow stats={stats} />
      {sources.length > 0 && (
        <SourcesRow sources={sources} onSourceClick={onSourceClick} />
      )}
    </div>
  );
}

/**
 * Строка с суммарной статистикой: deep link · рефералы · языки
 * @param props - Пропсы компонента
 * @returns JSX элемент строки
 */
function SummaryRow({ stats }: { stats: UserStats }): React.JSX.Element {
  const parts: string[] = [];

  if ((stats.deepLinkUsers ?? 0) > 0) {
    parts.push(`${stats.deepLinkUsers} deep link`);
  }
  if ((stats.referralUsers ?? 0) > 0) {
    parts.push(`${stats.referralUsers} рефералы`);
  }
  if ((stats.uniqueLanguages ?? 0) > 0) {
    parts.push(`${stats.uniqueLanguages} ${pluralLanguages(stats.uniqueLanguages ?? 0)}`);
  }

  return (
    <p className="text-xs text-muted-foreground">
      {parts.join(' · ')}
    </p>
  );
}

/**
 * Строка с pill-тегами источников трафика
 * @param props - Пропсы компонента
 * @returns JSX элемент строки источников
 */
function SourcesRow(props: {
  sources: Array<{ param: string; percentage: number }>;
  onSourceClick?: (source: string) => void;
}): React.JSX.Element {
  const { sources, onSourceClick } = props;

  return (
    <div className="flex flex-wrap gap-1">
      {sources.map((source) => (
        <Badge
          key={source.param}
          variant="secondary"
          className="text-xs cursor-pointer hover:bg-secondary/80 transition-colors"
          onClick={() => onSourceClick?.(source.param)}
        >
          {source.param} {source.percentage}%
        </Badge>
      ))}
    </div>
  );
}

/**
 * Склонение слова "язык" по числу
 * @param count - Количество языков
 * @returns Правильная форма слова
 */
function pluralLanguages(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod100 >= 11 && mod100 <= 14) return 'языков';
  if (mod10 === 1) return 'язык';
  if (mod10 >= 2 && mod10 <= 4) return 'языка';
  return 'языков';
}
