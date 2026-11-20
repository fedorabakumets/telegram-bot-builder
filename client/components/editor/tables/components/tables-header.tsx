/** @fileoverview Заголовок и контекст рабочей области таблиц. */
import { WorkspaceHeaderActionItems } from '@/components/ui/workspace-header-action-items';
import '../tables-header-controls.css';
import '../tables-header-adaptive.css';
import { WorkspaceAdaptiveHeader } from '@/components/ui/workspace-adaptive-header';
/** Общие меню проекта и ботов повторяют оформление пользователей. */
import '@/components/editor/database/user-database/content/users-workspace.css';
import { Table2, PanelLeftOpen, PanelLeftClose } from 'lucide-react';
import { useIsFetching, useQueryClient } from '@tanstack/react-query';
import { WorkspaceTabHeading } from '@/components/ui/workspace-tab-heading';
import { WorkspaceTabActions } from '@/components/ui/workspace-tab-actions';
import { ProjectSelector } from '@/components/editor/database/user-database/components/header/project-selector';
import { BotTokenSelector } from '@/components/editor/database/user-database/components/header/bot-token-selector';
import { useBotAudienceCounts } from '@/components/editor/database/user-database/components/header/use-bot-audience-counts';
import { useProjectTokens } from '@/hooks/use-project-tokens';
import { AllTablesActions } from './all-tables-actions';
import type { TablesPanelProps } from '../types';

/** Свойства заголовка таблиц. */
interface TablesHeaderProps extends TablesPanelProps {
  /** Список таблиц скрыт. */
  listCollapsed: boolean;
  /** Переключение списка без пустой полосы. */
  onToggleList: () => void;
}
/**
 * Использует общий заголовок рабочих вкладок и отдельные строки контекста и действий.
 * @param props - Контекст проекта и обработчик импорта.
 * @returns Заголовок рабочей области.
 */
export function TablesHeader({ projectId, allProjects, onProjectChange, selectedTokenId, onSelectToken, listCollapsed, onToggleList }: TablesHeaderProps) {
  const queryClient = useQueryClient();
  const refreshing = useIsFetching({ queryKey: ['bot-tables', projectId] }) > 0;
  const projectTokensInfo = useProjectTokens([projectId]);
  const tokens = projectTokensInfo[0]?.tokens ?? [];
  /** Подтверждённая аудитория совпадает с селектором диалогов. */
  const audience = useBotAudienceCounts(projectId);
  const hasProjects = !!allProjects && allProjects.length > 1 && !!onProjectChange;
  const hasTokens = tokens.length > 0 && !!onSelectToken;
  return (
    <div className="tables-header shrink-0">
      <div className="workspace-tab-frame workspace-tab-bar">
        <WorkspaceAdaptiveHeader className="tables-header-content" scopeSelector=".tables-context" actionsSelector=".workspace-tab-actions">
          <WorkspaceTabHeading title="Таблицы" icon={<Table2 />}
            description="Данные ботов и таблицы проекта."
            actions={<WorkspaceTabActions docsPath="interface/tables/overview" section="Таблицы"
              onRefresh={() => void queryClient.invalidateQueries({ queryKey: ['bot-tables', projectId] })}
              isRefreshing={refreshing} />} />
          {(hasProjects || hasTokens) && (
            <div role="group" aria-label="Проект и бот" className="tables-context flex min-w-0 flex-wrap items-center gap-3">
              <WorkspaceHeaderActionItems kind="selectors" items={[
              { id: 'project', content: hasProjects && (
                <ProjectSelector
                  projects={allProjects}
                  selectedProjectId={projectId}
                  showBotCount={selectedTokenId == null}
                  onSelect={onProjectChange}
                />
              ) },
              { id: 'bot', content: hasTokens && (
                <BotTokenSelector
                  projectId={projectId}
                  tokens={tokens}
                  audienceCounts={audience.counts}
                  countsError={audience.isError && !audience.data}
                  onRetryCounts={() => { void audience.refetch(); }}
                  selectedTokenId={selectedTokenId ?? null}
                  onSelect={(id) => onSelectToken?.(id)}
                />
              ) },
              ]} />
            </div>
          )}
        </WorkspaceAdaptiveHeader>
      </div>
      {/* Действия с таблицами занимают собственную строку. */}
      <div className="tables-header-tools workspace-tab-frame flex flex-wrap items-center gap-2">
        <button type="button" onClick={onToggleList} aria-expanded={!listCollapsed}
          aria-label={listCollapsed ? 'Развернуть список таблиц' : 'Свернуть список таблиц'}
          title={listCollapsed ? 'Развернуть список таблиц' : 'Свернуть список таблиц'}
          className="tables-control hidden items-center rounded-lg border border-border sm:inline-flex">
          {listCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          <span>Список таблиц</span>
        </button>
        <AllTablesActions projectId={projectId} />
      </div>
    </div>
  );
}
