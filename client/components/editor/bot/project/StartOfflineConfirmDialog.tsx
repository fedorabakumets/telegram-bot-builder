/**
 * @fileoverview Диалог подтверждения массового запуска офлайн-ботов
 * @module StartOfflineConfirmDialog
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

/** Свойства диалога */
interface StartOfflineConfirmDialogProps {
  /** Открыт ли диалог */
  open: boolean;
  /** Смена open */
  onOpenChange: (open: boolean) => void;
  /** Имя проекта */
  projectName: string;
  /** Число офлайн-ботов */
  offlineCount: number;
  /** Подтверждение */
  onConfirm: () => void;
}

/**
 * Confirm перед start-offline-all
 * @param props - Свойства
 * @returns JSX
 */
export function StartOfflineConfirmDialog({
  open,
  onOpenChange,
  projectName,
  offlineCount,
  onConfirm,
}: StartOfflineConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Запустить офлайн-ботов?</AlertDialogTitle>
          <AlertDialogDescription>
            Будет запущено {offlineCount} остановленных ботов проекта «{projectName}».
            Уже работающие боты и боты с недействительным токеном не будут затронуты.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Отмена</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              onOpenChange(false);
              onConfirm();
            }}
          >
            Запустить
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
