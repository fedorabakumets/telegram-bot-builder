/**
 * @fileoverview Компонент секции статистики с переключателем вида
 * @description Позволяет переключаться между классическими карточками и новым дашбордом
 */

import React, { useState } from 'react';
import { LayoutGrid, BarChart2 } from 'lucide-react';
import { StatsCards, StatsDashboard } from '../components/stats';
import { UserStats } from '../types';

/** Ключ для сохранения выбранного вида в localStorage */
const STATS_VIEW_KEY = 'stats-view-mode';

/**
 * Пропсы компонента DatabaseStatsSection
 */
interface DatabaseStatsSectionProps {
  /** Статистика пользователей */
  stats?: UserStats;
  /** Идентификатор проекта */
  projectId?: number;
  /** Идентификатор выбранного токена бота */
  selectedTokenId?: number | null;
  /** Обработчик клика по источнику трафика */
  onSourceClick?: (source: string) => void;
}

/**
 * Компонент секции статистики с переключателем вида
 * @param props - Пропсы компонента
 * @returns JSX компонент статистики или null
 */
export function DatabaseStatsSection(props: DatabaseStatsSectionProps): React.JSX.Element | null {
  const { stats, projectId, selectedTokenId, onSourceClick } = props;

  const [isDashboard, setIsDashboard] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem(STATS_VIEW_KEY);
    return saved !== 'classic';
  });

  if (!stats) return null;

  const handleToggle = (dashboard: boolean) => {
    setIsDashboard(dashboard);
    localStorage.setItem(STATS_VIEW_KEY, dashboard ? 'dashboard' : 'classic');
  };

  return (
    <div>
      {/* Переключатель вида */}
      <div className="flex items-center gap-0.5 bg-muted rounded-lg p-0.5 w-fit mb-3">
        <button
          onClick={() => handleToggle(false)}
          className={`p-1.5 rounded-md transition-colors ${
            !isDashboard
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          title="Классические карточки"
        >
          <LayoutGrid className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => handleToggle(true)}
          className={`p-1.5 rounded-md transition-colors ${
            isDashboard
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          title="Дашборд с аналитикой"
        >
          <BarChart2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Контент */}
      {!isDashboard || !projectId ? (
        <StatsCards stats={stats} />
      ) : (
        <StatsDashboard
          stats={stats}
          projectId={projectId}
          selectedTokenId={selectedTokenId}
          onSourceClick={onSourceClick}
        />
      )}
    </div>
  );
}
