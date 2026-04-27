/**
 * @fileoverview Заголовок проекта в панели ботов
 *
 * Отображает название проекта, счётчик ботов и кнопки
 * "Свернуть все" / "Развернуть все" (при botsCount > 1).
 *
 * @module ProjectHeader
 */

import { Button } from '@/components/ui/button';
import { ChevronsDownUp, ChevronsUpDown } from 'lucide-react';

/** Свойства заголовка проекта */
interface ProjectHeaderProps {
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
}

/**
 * Заголовок проекта
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function ProjectHeader({
  projectName, botsCount, onCollapseAll, onExpandAll, allCollapsed,
}: ProjectHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      <h3 className="text-lg sm:text-xl font-semibold text-foreground truncate min-w-0">
        {projectName}
      </h3>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-sm text-muted-foreground">
          Ботов: {botsCount}
        </span>
        {botsCount > 1 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-muted-foreground"
            onClick={allCollapsed ? onExpandAll : onCollapseAll}
            aria-label={allCollapsed ? 'Развернуть все карточки' : 'Свернуть все карточки'}
          >
            {allCollapsed
              ? <><ChevronsUpDown className="w-3 h-3 mr-1" />Развернуть все</>
              : <><ChevronsDownUp className="w-3 h-3 mr-1" />Свернуть все</>
            }
          </Button>
        )}
      </div>
    </div>
  );
}
