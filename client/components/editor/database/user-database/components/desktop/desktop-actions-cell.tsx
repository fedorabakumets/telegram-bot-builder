/**
 * @fileoverview Доступные действия строки пользователя и подтверждение удаления.
 */
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { TableCell } from '@/components/ui/table';
import { MessageSquare, ExternalLink, Trash2 } from 'lucide-react';
import { UserBotData } from '@shared/schema';

/** Свойства действий пользователя. */
interface DesktopActionsCellProps {
  /** Данные пользователя. */
  user: UserBotData;
  /** Индекс в списке. */
  index: number;
  /** Форматирование имени пользователя. */
  formatUserName: (user: UserBotData) => string;
  /** Мутация удаления пользователя. */
  deleteUserMutation: any;
  /** Открытие диалоговой панели. */
  onOpenDialogPanel?: (user: UserBotData) => void;
  /** Открытие панели деталей пользователя. */
  onOpenUserDetailsPanel?: (user: UserBotData) => void;
  /** Переход на вкладку диалогов. */
  onNavigateToDialog?: (user: UserBotData) => void;
}

/**
 * Показывает действия с доступными подписями и защитой от повторного удаления.
 * @param props - Свойства действий пользователя.
 * @returns Ячейка действий и диалог подтверждения.
 */
export function DesktopActionsCell(props: DesktopActionsCellProps): React.JSX.Element {
  const { user, index, formatUserName, deleteUserMutation, onOpenDialogPanel, onOpenUserDetailsPanel, onNavigateToDialog } = props;
  /** Имя в доступных подписях кнопок. */
  const userName = formatUserName(user);
  /** Общая блокировка удаления во время запроса. */
  const isDeleting = Boolean(deleteUserMutation.isPending);
  /** Спокойное оформление кнопок с заметным клавиатурным фокусом. */
  const actionClass = 'h-8 w-8 p-0 text-muted-foreground hover:bg-muted/40 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring';

  return (
    <TableCell className="py-2 text-right">
      <div className="flex items-center justify-end gap-1">
        {onOpenDialogPanel && (
          <Button variant="ghost" size="sm" className={actionClass}
            title="Открыть диалог" aria-label={`Открыть диалог: ${userName}`}
            onClick={(event) => {
              event.stopPropagation();
              onOpenDialogPanel(user);
              onOpenUserDetailsPanel?.(user);
            }}>
            <MessageSquare className="h-4 w-4" aria-hidden="true" />
          </Button>
        )}
        {onNavigateToDialog && (
          <Button variant="ghost" size="sm" className={actionClass}
            title="Открыть во вкладке «Диалоги»" aria-label={`Открыть во вкладке «Диалоги»: ${userName}`}
            onClick={(event) => { event.stopPropagation(); onNavigateToDialog(user); }}>
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </Button>
        )}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" disabled={isDeleting}
              className={`${actionClass} hover:text-destructive`}
              data-testid={`button-delete-user-${index}`} title="Удалить пользователя"
              aria-label={`Удалить пользователя: ${userName}`}
              onClick={(event) => event.stopPropagation()}>
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="users-portal border-border bg-background">
            <AlertDialogHeader>
              <AlertDialogTitle>Удалить пользователя?</AlertDialogTitle>
              <AlertDialogDescription>
                Все данные пользователя «{userName}» будут удалены. Это действие нельзя отменить.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2">
              <AlertDialogCancel disabled={isDeleting}>Отмена</AlertDialogCancel>
              <AlertDialogAction disabled={isDeleting} aria-busy={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => { if (!isDeleting) deleteUserMutation.mutate(Number(user.userId)); }}>
                {isDeleting ? 'Удаление…' : 'Удалить пользователя'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TableCell>
  );
}
