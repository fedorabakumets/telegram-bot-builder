/** @fileoverview Единая шапка аналитики с описанием, документацией и выбором области данных. */
import { useEffect, useState, type ReactNode } from 'react';
import { BarChart2 } from 'lucide-react';
import type { BotToken } from '@shared/schema';
import { WorkspaceTabHeading } from '@/components/ui/workspace-tab-heading';
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
  /** Список ботов получает готовые числа раньше графиков; полный снимок остаётся резервом. */
  const fastAudience = useBotAudienceCounts(projectId);
  useEffect(() => { if (periodRequest) setCollapsed(false); }, [periodRequest]);
  const hasProjects = !!allProjects && allProjects.length > 1 && !!onProjectChange;
  /** Промежуток появляется только при видимой кнопке сворачивания. */
  return <header className={`workspace-tab-frame analytics-responsive-header flex shrink-0 flex-col gap-4 ${collapsed ? "is-collapsed" : ""}`}>
    <button type="button" className="analytics-header-toggle" aria-expanded={!collapsed} onClick={() => setCollapsed(!collapsed)}>{collapsed ? "Показать фильтры" : "Свернуть шапку"}</button>
    <WorkspaceAdaptiveHeader className="analytics-header-content" scopeSelector=".analytics-scope" actionsSelector=".workspace-tab-actions">
    <WorkspaceTabHeading title="Аналитика" icon={<BarChart2 />}
      description="Рост аудитории, активность и источники трафика."
      actions={<WorkspaceTabActions docsPath="interface/analytics" section="Аналитика"
        onRefresh={onRefresh} isRefreshing={isRefreshing} />} />
    {(hasProjects || tokens.length > 0 || periodControl) && <div role="group" aria-label="Проект и бот"
      className="analytics-scope">
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
