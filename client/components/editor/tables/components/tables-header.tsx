/** @fileoverview Заголовок и контекст рабочей области таблиц. */
import { RefreshCw, PanelLeftOpen, PanelLeftClose } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
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
 * Размещает название, контекст проекта и действия в общей адаптивной строке.
 * @param props - Контекст проекта и обработчик импорта.
 * @returns Заголовок рабочей области.
 */
export function TablesHeader({ projectId, allProjects, onProjectChange, selectedTokenId, onSelectToken, listCollapsed, onToggleList }: TablesHeaderProps) {
  const queryClient = useQueryClient();
  const projectTokensInfo = useProjectTokens([projectId]);
  const tokens = projectTokensInfo[0]?.tokens ?? [];
  return (
    <header className="tables-header shrink-0 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-3 min-w-0 shrink-0">
          <button type="button" onClick={onToggleList} aria-expanded={!listCollapsed}
            aria-label={listCollapsed ? 'Развернуть список таблиц' : 'Свернуть список таблиц'}
            title={listCollapsed ? 'Развернуть список таблиц' : 'Свернуть список таблиц'}
            className="tables-control hidden sm:block rounded-lg border border-border p-2">
            {listCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          </button>
          <h2 className="text-lg font-semibold" title="Данные ботов и таблицы проекта">Таблицы</h2>
        </div>
      <div className="tables-context flex flex-wrap items-center gap-3">
        {allProjects && allProjects.length > 1 && onProjectChange && (
          <ProjectSelector
            projects={allProjects}
            selectedProjectId={projectId}
            onSelect={onProjectChange}
          />
        )}
        {tokens.length > 0 && onSelectToken && (
          <BotTokenSelector
            projectId={projectId}
            tokens={tokens}
            selectedTokenId={selectedTokenId ?? null}
            onSelect={(id) => onSelectToken(id)}
          />
        )}
      </div>
        <div className="tables-header-actions ml-auto flex items-center gap-2">
          <button type="button" aria-label="Обновить данные таблиц" title="Обновить данные таблиц"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['bot-tables'] })}
            className="tables-control rounded-md border border-border p-2 text-muted-foreground">
            <RefreshCw className="h-4 w-4" />
          </button>
          <AllTablesActions projectId={projectId} />
        </div>
      </div>

    </header>
  );
}
