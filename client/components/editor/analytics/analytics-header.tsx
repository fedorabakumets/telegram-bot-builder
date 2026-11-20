/** @fileoverview Единая шапка аналитики с описанием, документацией и выбором области данных. */
import { useEffect, useId, useState, type ReactNode } from 'react';
import { BarChart2, SlidersHorizontal } from 'lucide-react';
import type { BotToken } from '@shared/schema';
import { WorkspaceTabHeading } from '@/components/ui/workspace-tab-heading';
import { Button } from '@/components/ui/button';
import { WorkspaceAdaptiveHeader } from '@/components/ui/workspace-adaptive-header';
import { WorkspaceTabActions } from '@/components/ui/workspace-tab-actions';
import { ProjectSelector } from '@/components/editor/database/user-database/components/header/project-selector';
import { BotTokenSelector } from '@/components/editor/database/user-database/components/header/bot-token-selector';
import { useBotAudienceCounts } from '@/components/editor/database/user-database/components/header/use-bot-audience-counts';
import type { AnalyticsPanelProps } from './analytics-panel';

/** Контекст аналитики и состояние обновления показателей. */
interface AnalyticsHeaderProps extends AnalyticsPanelProps {
  /** Запрос открытия календаря из карточки. */
  periodRequest?: number;
  /** Доступные боты текущего проекта. */
  tokens: BotToken[];
  /** Запрос статистики выполняется. */
  isRefreshing: boolean;
  /** Загрузить свежую статистику. */
  onRefresh: () => void;
  /** Аудитория выбранного бота из текущего согласованного снимка. */
  totalUsers?: number;
  /** Общий выбор периода, расположенный рядом с областью отчёта. */
  periodControl?: ReactNode;
  /** Подтверждённая аудитория всех ботов проекта. */
  audienceCounts?: Map<number, number>;
}

/**
 * Показывает назначение аналитики и отделяет выбор проекта от действий страницы.
 * @param props - Проект, боты и обработчики обновления и выбора.
 * @returns Адаптивная шапка рабочей вкладки.
 */
export function AnalyticsHeader({ projectId, tokens, selectedTokenId, onSelectToken,
  allProjects, onProjectChange, isRefreshing, onRefresh, totalUsers, audienceCounts, periodControl, periodRequest }: AnalyticsHeaderProps) {
  const [collapsed, setCollapsed] = useState(false);
  const filtersId = useId();
  /** Список ботов получает готовые числа раньше графиков; полный снимок остаётся резервом. */
  const fastAudience = useBotAudienceCounts(projectId);
  useEffect(() => { if (periodRequest) setCollapsed(false); }, [periodRequest]);
  const hasProjects = !!allProjects && allProjects.length > 1 && !!onProjectChange;
  const hasFilters = hasProjects || tokens.length > 0 || Boolean(periodControl);
  const filtersLabel = collapsed ? 'Показать фильтры' : 'Свернуть фильтры';
  return <header className="workspace-tab-frame workspace-tab-bar shrink-0">
    <WorkspaceAdaptiveHeader className="analytics-header-content" scopeSelector=".analytics-scope" actionsSelector=".analytics-heading-actions">
    <WorkspaceTabHeading title="Аналитика" icon={<BarChart2 />}
      description="Рост аудитории, активность и источники трафика."
      actions={<div className="analytics-heading-actions flex items-center gap-2">
        {hasFilters && <Button type="button" variant="ghost" size="icon" className="analytics-filter-toggle h-8 w-8 shrink-0"
          aria-label={filtersLabel} title={filtersLabel} aria-controls={filtersId} aria-expanded={!collapsed}
          onClick={() => setCollapsed((previous) => !previous)}><SlidersHorizontal aria-hidden="true" /></Button>}
        <WorkspaceTabActions docsPath="interface/analytics" section="Аналитика" onRefresh={onRefresh} isRefreshing={isRefreshing} />
      </div>} />
    {hasFilters && <div id={filtersId} role="group" aria-label="Фильтры отчётов"
      className="analytics-scope" data-collapsed={collapsed}>
      {hasProjects && <div className="analytics-scope-project"><ProjectSelector projects={allProjects} selectedProjectId={projectId} showBotCount={selectedTokenId == null}
        onSelect={id => { onSelectToken?.(null); onProjectChange(id); }} /></div>}
      {tokens.length > 0 && <div className="analytics-scope-bot"><BotTokenSelector projectId={projectId} tokens={tokens}
        audienceCounts={fastAudience.data ? fastAudience.counts : audienceCounts ?? new Map(selectedTokenId != null && totalUsers !== undefined ? [[selectedTokenId, totalUsers]] : [])}
        countsError={fastAudience.isError && !fastAudience.data} onRetryCounts={() => { void fastAudience.refetch(); }}
        selectedTokenId={selectedTokenId ?? null} onSelect={id => onSelectToken?.(id)} /></div>}
      {periodControl && <div className="analytics-scope-period">{periodControl}</div>}
    </div>}
    </WorkspaceAdaptiveHeader>
  </header>;
}
