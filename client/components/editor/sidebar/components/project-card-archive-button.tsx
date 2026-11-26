/**
 * @fileoverview Постоянно видимая кнопка архивации/возврата проекта в карточке сайдбара
 * @module components/editor/sidebar/components/project-card-archive-button
 */

import { Archive, ArchiveRestore } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Пропсы кнопки архивации проекта
 */
export interface ProjectCardArchiveButtonProps {
  /** true — показать «Вернуть из архива» */
  isArchivedView: boolean;
  /** Обработчик архивации */
  onArchive: () => void;
  /** Обработчик возврата из архива */
  onUnarchive: () => void;
  /** Блокировка кнопки */
  disabled?: boolean;
}

/**
 * Кнопка «В архив» или «Вернуть из архива» в карточке проекта
 * @param props - Свойства компонента
 * @returns JSX элемент кнопки
 */
export function ProjectCardArchiveButton({
  isArchivedView,
  onArchive,
  onUnarchive,
  disabled = false,
}: ProjectCardArchiveButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        if (isArchivedView) {
          onUnarchive();
        } else {
          onArchive();
        }
      }}
      className="h-6 w-6 xs:h-7 xs:w-7 sm:h-8 sm:w-8 p-0 text-slate-400 dark:text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors hover:bg-amber-500/20 rounded-md flex-shrink-0"
      title={isArchivedView ? 'Вернуть из архива' : 'В архив'}
    >
      {isArchivedView ? (
        <ArchiveRestore className="h-3 xs:h-3.5 w-3 xs:w-3.5" />
      ) : (
        <Archive className="h-3 xs:h-3.5 w-3 xs:w-3.5" />
      )}
    </Button>
  );
}
