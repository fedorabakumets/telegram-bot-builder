/**
 * @fileoverview Компонент кнопок действий заголовка
 * @description Кнопка очистки базы пользователей
 */

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

/**
 * Пропсы компонента HeaderActions
 */
interface HeaderActionsProps {
  /** ID проекта */
  projectId: number;
  /** Название проекта */
  projectName: string;
  /** Функция обновления (не используется в этом компоненте) */
  onRefresh?: () => void;
  /** Выбранный бот; null означает всех ботов проекта */
  selectedTokenId?: number | null;
  /** Выполняется очистка базы */
  isPending?: boolean;
  /** Функция очистки базы */
  onDeleteAll: () => void;
}

/**
 * Компонент кнопок действий
 * @param props - Пропсы компонента
 * @returns JSX компонент кнопок
 */
export function HeaderActions({
  projectId,
  projectName,
  onDeleteAll,
  selectedTokenId = null,
  isPending = false,
}: HeaderActionsProps): React.JSX.Element {
  return (
    <div
      className="flex gap-2"
      data-project-id={projectId}
      title={`Действия для проекта ${projectName}`}
    >
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 rounded-lg border-border px-3 text-muted-foreground hover:text-foreground"
            aria-label="Очистить данные пользователей"
            disabled={isPending}
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline ml-2">Очистить</span>
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="users-portal">
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить все данные пользователей?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Будут удалены данные пользователей {selectedTokenId == null ? `всех ботов проекта «${projectName}»` : `выбранного бота в проекте «${projectName}»`}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDeleteAll}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? 'Удаление…' : 'Удалить данные'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
