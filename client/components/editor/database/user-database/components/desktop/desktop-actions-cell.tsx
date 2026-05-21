/**
 * @fileoverview Компонент ячейки действий пользователя
 * @description Кнопки: открыть диалог, удалить
 */

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { TableCell } from '@/components/ui/table';
import { MessageSquare, Trash2 } from 'lucide-react';
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
  /** Мутация удаления пользователя */
  deleteUserMutation: any;
  /** Открытие диалоговой панели */
  onOpenDialogPanel?: (user: UserBotData) => void;
}

/**
 * Компонент ячейки действий
 * @param props - Пропсы компонента
 * @returns JSX компонент ячейки
 */
export function DesktopActionsCell(props: DesktopActionsCellProps): React.JSX.Element {
  const { user, index, formatUserName, deleteUserMutation, onOpenDialogPanel } = props;

  return (
    <TableCell className="py-2 text-right">
      <div className="flex items-center justify-end gap-1">
        {/* Кнопка открытия диалога */}
        {onOpenDialogPanel && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            title="Открыть диалог"
            onClick={(e) => { e.stopPropagation(); onOpenDialogPanel(user); }}
          >
            <MessageSquare className="w-3.5 h-3.5" />
          </Button>
        )}

        {/* Кнопка удаления */}
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
              <AlertDialogAction onClick={() => deleteUserMutation.mutate(Number(user.userId))}>
                Удалить
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TableCell>
  );
}
