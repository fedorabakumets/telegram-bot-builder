/**
 * @fileoverview Диалог подтверждения удаления рассылки с пояснением последствий
 * @module editor/database/dialog/components/broadcast-delete-confirm
 */

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

/**
 * Пропсы компонента BroadcastDeleteConfirm
 */
interface BroadcastDeleteConfirmProps {
  /** Флаг открытия диалога */
  open: boolean;
  /** Обработчик изменения флага открытия */
  onOpenChange: (open: boolean) => void;
  /** Количество ботов, у получателей которых удалятся сообщения */
  botCount?: number;
  /** Обработчик подтверждения удаления */
  onConfirm: () => void;
}

/**
 * Подтверждение удаления рассылки.
 * Явно предупреждает, что сообщения будут удалены у получателей в Telegram.
 *
 * @param props - Свойства компонента
 * @returns JSX элемент диалога подтверждения
 */
export function BroadcastDeleteConfirm({ open, onOpenChange, botCount, onConfirm }: BroadcastDeleteConfirmProps) {
  const isMulti = (botCount ?? 1) > 1;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Удалить рассылку?</AlertDialogTitle>
          <AlertDialogDescription>
            {isMulti
              ? `Сообщения будут удалены в Telegram у всех получателей — по каждому из ${botCount} ботов. История рассылки тоже удалится. Отменить действие нельзя.`
              : 'Сообщения будут удалены в Telegram у всех получателей, а история рассылки — из проекта. Отменить действие нельзя.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Отмена</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Удалить
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
