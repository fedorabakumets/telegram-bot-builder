/**
 * @fileoverview Заголовок проекта в панели ботов
 *
 * Отображает название проекта, счётчик ботов и кнопки
 * "Свернуть все" / "Развернуть все" (при botsCount > 1).
 *
 * @module ProjectHeader
 */

import { Button } from '@/components/ui/button';
import { ChevronsDownUp, ChevronsUpDown, RefreshCw } from 'lucide-react';
import { IdBadge } from '@/components/editor/database/user-database/components/header/project-name-label';

/** Свойства заголовка проекта */
interface ProjectHeaderProps {
  /** ID проекта */
  projectId: number;
  /** Название проекта */
  projectName: string;
  /** Количество ботов в проекте */
  botsCount: number;
  /** Колбэк для сворачивания всех карточек */
  onCollapseAll?: () => void;
  /** Колбэк для разворачивания всех карточек */
  onExpandAll?: () => void;
  /** Все ли карточки свёрнуты */
  allCollapsed?: boolean;
  /** Колбэк для перезапуска всех ботов проекта */
  onRestartAll?: () => void;
  /** Идёт ли перезапуск всех ботов */
  isRestartingAll?: boolean;
}

/**
 * Заголовок проекта
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function ProjectHeader({
  projectId, projectName, botsCount, onCollapseAll, onExpandAll, allCollapsed,
  onRestartAll, isRestartingAll,
}: ProjectHeaderProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <h3 className="flex min-w-0 items-center gap-2 text-base sm:text-lg font-semibold text-foreground">
        <span className="truncate">{projectName}</span>
        <IdBadge id={projectId} className="text-[11px]" />
      </h3>
      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
        <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
          Ботов: {botsCount}
        </span>
        {botsCount > 0 && (
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
        {botsCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-1.5 sm:px-2 text-xs text-muted-foreground"
            onClick={onRestartAll}
            disabled={isRestartingAll}
            aria-label="Перезапустить всех ботов проекта"
          >
            <RefreshCw className={`w-3 h-3 sm:mr-1 ${isRestartingAll ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isRestartingAll ? 'Перезапуск...' : 'Перезапустить'}</span>
          </Button>
        )}
      </div>
    </div>
  );
}
