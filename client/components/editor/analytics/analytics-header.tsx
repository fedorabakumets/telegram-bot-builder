/** @fileoverview Единая шапка аналитики с описанием, документацией и выбором области данных. */
import { useEffect, useState, type ReactNode } from 'react';
import { BarChart2 } from 'lucide-react';
import type { BotToken } from '@shared/schema';
import { WorkspaceTabHeading } from '@/components/ui/workspace-tab-heading';
import { WorkspaceTabActions } from '@/components/ui/workspace-tab-actions';
import { ProjectSelector } from '@/components/editor/database/user-database/components/header/project-selector';
import { BotTokenSelector } from '@/components/editor/database/user-database/components/header/bot-token-selector';
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
  useEffect(() => { if (periodRequest) setCollapsed(false); }, [periodRequest]);
  const hasProjects = !!allProjects && allProjects.length > 1 && !!onProjectChange;
  return <header className={`workspace-tab-frame analytics-responsive-header shrink-0 space-y-4 ${collapsed ? "is-collapsed" : ""}`}>
    <button type="button" className="analytics-header-toggle" aria-expanded={!collapsed} onClick={() => setCollapsed(!collapsed)}>{collapsed ? "Показать фильтры" : "Свернуть шапку"}</button>
    <div className="analytics-header-content space-y-4">
    <WorkspaceTabHeading title="Аналитика" icon={<BarChart2 />}
      description="Рост аудитории, активность и источники трафика."
      actions={<WorkspaceTabActions docsPath="interface/analytics" section="Аналитика"
        onRefresh={onRefresh} isRefreshing={isRefreshing} />} />
    {(hasProjects || tokens.length > 0 || periodControl) && <div role="group" aria-label="Проект и бот"
      className="analytics-scope flex min-w-0 flex-wrap items-center gap-3">
      {hasProjects && <div className="analytics-scope-project"><ProjectSelector projects={allProjects} selectedProjectId={projectId}
        onSelect={id => { onSelectToken?.(null); onProjectChange(id); }} /></div>}
      {tokens.length > 0 && <div className="analytics-scope-bot"><BotTokenSelector projectId={projectId} tokens={tokens}
        audienceCounts={audienceCounts ?? new Map(selectedTokenId != null && totalUsers !== undefined ? [[selectedTokenId, totalUsers]] : [])}
        selectedTokenId={selectedTokenId ?? null} onSelect={id => onSelectToken?.(id)} /></div>}
      <div className="analytics-scope-period">{periodControl}</div>
    </div>}
    </div>
  </header>;
}
