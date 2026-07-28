/**
 * @fileoverview Заголовок проекта в списке ботов (имя, collapse)
 * @module ProjectHeader
 */

import { Button } from '@/components/ui/button';
import { ChevronsDownUp, ChevronsUpDown } from 'lucide-react';
import { IdBadge } from '@/components/editor/database/user-database/components/header/project-name-label';
import {
  ProjectBotBulkActions,
  type ProjectBotBulkActionsProps,
} from './ProjectBotBulkActions';

/** Свойства заголовка проекта */
interface ProjectHeaderProps extends Partial<ProjectBotBulkActionsProps> {
  /** ID проекта */
  projectId: number;
  /** Название проекта */
  projectName: string;
  /** Количество ботов */
  botsCount: number;
  /** Свернуть все */
  onCollapseAll?: () => void;
  /** Развернуть все */
  onExpandAll?: () => void;
  /** Все свёрнуты */
  allCollapsed?: boolean;
  /** Показать bulk-кнопки (false — они в TabHeader) */
  showBulkActions?: boolean;
  /** Скрыть название и #id (уже в TabHeader) */
  hideTitle?: boolean;
}

/**
 * Заголовок проекта со счётчиком и опциональными bulk-действиями
 * @param props - Свойства
 * @returns JSX
 */
export function ProjectHeader({
  projectId,
  projectName,
  botsCount,
  onCollapseAll,
  onExpandAll,
  allCollapsed,
  onRestartAll,
  isRestartingAll,
  offlineCount = 0,
  onStartOfflineAll,
  isStartingOffline,
  showBulkActions = true,
  hideTitle = false,
}: ProjectHeaderProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {!hideTitle && (
        <h3 className="flex min-w-0 items-center gap-2 text-base sm:text-lg font-semibold text-foreground">
          <span className="truncate">{projectName}</span>
          <IdBadge id={projectId} className="text-[11px]" />
        </h3>
      )}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
        {!hideTitle && (
          <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
            Ботов: {botsCount}
          </span>
        )}
        {botsCount > 0 && onCollapseAll && onExpandAll && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-1.5 sm:px-2 text-xs text-muted-foreground"
            onClick={allCollapsed ? onExpandAll : onCollapseAll}
            aria-label={allCollapsed ? 'Развернуть все карточки' : 'Свернуть все карточки'}
          >
            {allCollapsed
              ? <><ChevronsUpDown className="w-3 h-3 sm:mr-1" /><span className="hidden sm:inline">Развернуть все</span></>
              : <><ChevronsDownUp className="w-3 h-3 sm:mr-1" /><span className="hidden sm:inline">Свернуть все</span></>
            }
          </Button>
        )}
        {showBulkActions && (
          <ProjectBotBulkActions
            projectId={projectId}
            projectName={projectName}
            botsCount={botsCount}
            onRestartAll={onRestartAll}
            isRestartingAll={isRestartingAll}
            offlineCount={offlineCount}
            onStartOfflineAll={onStartOfflineAll}
            isStartingOffline={isStartingOffline}
          />
        )}
      </div>
    </div>
  );
}
