/** @fileoverview Единая шапка аналитики с описанием, документацией и выбором области данных. */
import type { ReactNode } from 'react';
import { BarChart2 } from 'lucide-react';
import type { BotToken } from '@shared/schema';
import { WorkspaceTabHeading } from '@/components/ui/workspace-tab-heading';
import { WorkspaceTabActions } from '@/components/ui/workspace-tab-actions';
import { ProjectSelector } from '@/components/editor/database/user-database/components/header/project-selector';
import { BotTokenSelector } from '@/components/editor/database/user-database/components/header/bot-token-selector';
import type { AnalyticsPanelProps } from './analytics-panel';

/** Контекст аналитики и состояние обновления показателей. */
interface AnalyticsHeaderProps extends AnalyticsPanelProps {
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
  allProjects, onProjectChange, isRefreshing, onRefresh, totalUsers, audienceCounts, periodControl }: AnalyticsHeaderProps) {
  const hasProjects = !!allProjects && allProjects.length > 1 && !!onProjectChange;
  return <header className="workspace-tab-frame shrink-0 space-y-4">
    <WorkspaceTabHeading title="Аналитика" icon={<BarChart2 />}
      description="Рост аудитории, активность и источники трафика."
      actions={<WorkspaceTabActions docsPath="interface/analytics" section="Аналитика"
        onRefresh={onRefresh} isRefreshing={isRefreshing} />} />
    {(hasProjects || tokens.length > 0 || periodControl) && <div role="group" aria-label="Проект и бот"
      className="analytics-scope flex min-w-0 flex-wrap items-center gap-3">
      {hasProjects && <ProjectSelector projects={allProjects} selectedProjectId={projectId}
        onSelect={id => { onSelectToken?.(null); onProjectChange(id); }} />}
      {tokens.length > 0 && <BotTokenSelector projectId={projectId} tokens={tokens}
        audienceCounts={audienceCounts ?? new Map(selectedTokenId != null && totalUsers !== undefined ? [[selectedTokenId, totalUsers]] : [])}
        selectedTokenId={selectedTokenId ?? null} onSelect={id => onSelectToken?.(id)} />}
      {periodControl}
    </div>}
  </header>;
}
