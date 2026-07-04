/**
 * @fileoverview Нижняя плашка массовых действий над выбранными файлами
 * `SelectionActionBar`: показывает количество выбранных и действия
 * «Прикрепить» (только при canAttach — есть attachTarget, Req 3.3, 3.4),
 * «Удалить» (с подтверждением, дизейбл во время удаления) и «Снять выбор»
 * (Req 3.2, 3.5). Использует shadcn/ui Button и смысловые иконки lucide-react
 * (Paperclip/Trash2/X), без декоративных эмодзи (Req 13.1, 13.2).
 * @module components/editor/files/panel/selection-action-bar
 */

import { Paperclip, Trash2, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { SELECTION_BAR_CLASS } from './panel-styles';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

/** Пропсы панели действий над выбранными файлами */
export interface SelectionActionBarProps {
  /** Кол-во выбранных файлов */
  selectedCount: number;
  /** Доступно ли прикрепление (есть attachTarget) */
  canAttach: boolean;
  /** Прикрепить выбранные файлы к ноде */
  onAttach: () => void;
  /** Массовое удаление выбранных файлов */
  onDelete: () => void;
  /** Снять выделение со всех файлов */
  onClearSelection: () => void;
  /** Идёт удаление (дизейблит кнопку «Удалить») */
  isDeleting?: boolean;
}

/**
 * Плашка массовых действий: видна, когда выбран хотя бы один файл (Req 3.2).
 * @param props - Кол-во выбранных, флаги и колбэки действий
 * @returns JSX элемент плашки действий
 */
export function SelectionActionBar({
  selectedCount,
  canAttach,
  onAttach,
  onDelete,
  onClearSelection,
  isDeleting = false,
}: SelectionActionBarProps) {
  return (
    <div
      className={SELECTION_BAR_CLASS}
      data-testid="selection-action-bar"
    >
      <span className="text-sm text-muted-foreground tabular-nums" data-testid="selection-count">
        Выбрано: {selectedCount}
      </span>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          data-testid="clear-selection"
        >
          <X className="mr-1.5 h-3.5 w-3.5" />
          Снять выбор
        </Button>

        {canAttach && (
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={onAttach}
            data-testid="attach-selected"
          >
            <Paperclip className="mr-1.5 h-3.5 w-3.5" />
            Прикрепить ({selectedCount})
          </Button>
        )}

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={isDeleting}
              data-testid="delete-selected"
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Удалить ({selectedCount})
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Удалить выбранные файлы?</AlertDialogTitle>
              <AlertDialogDescription>
                Будет удалено файлов: {selectedCount}. Действие необратимо.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Отмена</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete} data-testid="confirm-delete">
                Удалить
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
