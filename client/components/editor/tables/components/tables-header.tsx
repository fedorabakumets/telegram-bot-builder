/** @fileoverview Заголовок и контекст рабочей области таблиц. */
import { Table2, PanelLeftOpen, PanelLeftClose } from 'lucide-react';
import { useIsFetching, useQueryClient } from '@tanstack/react-query';
import { WorkspaceCollapsibleHeader } from '@/components/ui/workspace-collapsible-header';
import { WorkspaceTabHeading } from '@/components/ui/workspace-tab-heading';
import { WorkspaceTabActions } from '@/components/ui/workspace-tab-actions';
import { ProjectSelector } from '@/components/editor/database/user-database/components/header/project-selector';
import { BotTokenSelector } from '@/components/editor/database/user-database/components/header/bot-token-selector';
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
  const hasProjects = !!allProjects && allProjects.length > 1 && !!onProjectChange;
  const hasTokens = tokens.length > 0 && !!onSelectToken;
  return (
    <div className="tables-header workspace-tab-frame shrink-0 space-y-4">
      <WorkspaceCollapsibleHeader><div className="space-y-4"><WorkspaceTabHeading title="Таблицы" icon={<Table2 />}
        description="Данные ботов и таблицы проекта."
        actions={<WorkspaceTabActions docsPath="interface/tables/overview" section="Таблицы"
          onRefresh={() => void queryClient.invalidateQueries({ queryKey: ['bot-tables', projectId] })}
          isRefreshing={refreshing} />} />
      {(hasProjects || hasTokens) && <div role="group" aria-label="Проект и бот" className="tables-context flex min-w-0 flex-wrap items-center gap-3">
        {hasProjects && (
          <ProjectSelector
            projects={allProjects}
            selectedProjectId={projectId}
            onSelect={onProjectChange}
          />
        )}
        {hasTokens && (
          <BotTokenSelector
            projectId={projectId}
            tokens={tokens}
            selectedTokenId={selectedTokenId ?? null}
            onSelect={(id) => onSelectToken?.(id)}
          />
        )}
      </div>}
      <div className="tables-header-tools flex flex-wrap items-center gap-2">
        <button type="button" onClick={onToggleList} aria-expanded={!listCollapsed}
          aria-label={listCollapsed ? 'Развернуть список таблиц' : 'Свернуть список таблиц'}
          title={listCollapsed ? 'Развернуть список таблиц' : 'Свернуть список таблиц'}
          className="tables-control hidden items-center rounded-lg border border-border sm:inline-flex">
          {listCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          <span>Список таблиц</span>
        </button>
        <AllTablesActions projectId={projectId} />
      </div></div></WorkspaceCollapsibleHeader>
    </div>
  );
}
