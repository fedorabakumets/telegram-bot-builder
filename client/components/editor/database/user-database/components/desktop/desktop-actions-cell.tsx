/**
 * @fileoverview Компонент ячейки действий пользователя
 * @description Кнопки: просмотр, чат, активировать/деактивировать, удалить
 */

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { TableCell } from '@/components/ui/table';
import { Eye, MessageSquare, Trash2, UserCheck, UserX } from 'lucide-react';
import { UserBotData } from '@shared/schema';

/**
 * Пропсы компонента DesktopActionsCell
 */
interface DesktopActionsCellProps {
  /** Данные пользователя */
  user: UserBotData;
  /** Индекс в списке */
  index: number;
  /** Функция форматирования имени */
  formatUserName: (user: UserBotData) => string;
  /** Функция открытия панели деталей */
  onOpenUserDetailsPanel?: (user: UserBotData) => void;
  /** Функция открытия диалога */
  onOpenDialogPanel?: (user: UserBotData) => void;
  /** Функция переключения статуса */
  handleUserStatusToggle: (user: UserBotData, field: 'isActive' | 'isBlocked' | 'isPremium') => void;
  /** Мутация удаления пользователя */
  deleteUserMutation: any;
}

/**
 * Компонент ячейки действий
 * @param props - Пропсы компонента
 * @returns JSX компонент ячейки
 */
export function DesktopActionsCell(props: DesktopActionsCellProps): React.JSX.Element {
  const { user, index, formatUserName, onOpenUserDetailsPanel, onOpenDialogPanel, handleUserStatusToggle, deleteUserMutation } = props;

  return (
    <TableCell className="py-2 text-right">
      <div className="flex items-center justify-end gap-0.5">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          data-testid={`button-view-user-${index}`}
          onClick={(e) => {
            e.stopPropagation();
            console.log('[DesktopActionsCell] Eye button clicked for user:', user);
            console.log('[DesktopActionsCell] Calling onOpenUserDetailsPanel with:', user);
            onOpenUserDetailsPanel?.(user);
          }}
          title="Подробно"
        >
          <Eye className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          data-testid={`button-show-dialog-${index}`}
          onClick={(e) => {
            e.stopPropagation();
            console.log('[DesktopActionsCell] Chat button clicked for user:', user);
            console.log('[DesktopActionsCell] Calling onOpenDialogPanel with:', user);
            onOpenDialogPanel?.(user);
          }}
          title="Чат"
        >
          <MessageSquare className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          data-testid={`button-toggle-active-${index}`}
          onClick={(e) => {
            e.stopPropagation();
            handleUserStatusToggle(user, 'isActive');
          }}
          title={user.isActive === 1 ? 'Деактивировать' : 'Активировать'}
        >
          {user.isActive === 1 ? (
            <UserX className="w-3.5 h-3.5 text-destructive" />
          ) : (
            <UserCheck className="w-3.5 h-3.5 text-green-600" />
          )}
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-destructive hover:text-destructive"
              data-testid={`button-delete-user-${index}`}
              title="Удалить"
              onClick={(e) => e.stopPropagation()}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Удалить пользователя?</AlertDialogTitle>
              <AlertDialogDescription>
                Это действие нельзя отменить. Все данные пользователя "{formatUserName(user)}" будут удалены.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Отмена</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteUserMutation.mutate(user.id)}>
                Удалить
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TableCell>
  );
}
