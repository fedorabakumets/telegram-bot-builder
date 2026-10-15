/**
 * @fileoverview Кнопка запуска массовой проверки доступов с подтверждением.
 * @module client/components/editor/analytics/analytics-access-check-button
 */
import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

/** Подсказка о кратком статусе «печатает…». */
export const ACCESS_CHECK_TYPING_HINT = 'Во время проверки пользователь может на несколько секунд увидеть статус «печатает…» от бота. Сообщения отправлены не будут.';

/**
 * Пропсы кнопки проверки.
 */
interface AnalyticsAccessCheckButtonProps {
  /** Сколько пользователей попадёт в проверку. */
  totalUsers: number;
  /** Идёт запрос старта. */
  pending?: boolean;
  /** Нельзя запустить, пока не выбран конкретный бот. */
  disabled?: boolean;
  /** Запуск после подтверждения. */
  onConfirm: () => void;
}

/**
 * Кнопка «Проверить доступы» и диалог с числом пользователей.
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function AnalyticsAccessCheckButton({ totalUsers, pending, disabled, onConfirm }: AnalyticsAccessCheckButtonProps) {
  const [open, setOpen] = useState(false);
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-7 shrink-0 gap-1.5 px-2.5 text-xs"
        disabled={pending || disabled}
        title={disabled ? 'Сначала выберите бота' : undefined}
        onClick={() => setOpen(true)}
      >
        <ShieldCheck className="h-3.5 w-3.5" />
        Проверить доступы
      </Button>
      <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Проверить доступы</AlertDialogTitle>
            <AlertDialogDescription>
              В карточке {totalUsers} человек. Проверяются только те, кто открывал бота в личном чате. Кто писал лишь в группе или канале, не входит. {ACCESS_CHECK_TYPING_HINT}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction disabled={pending} onClick={onConfirm}>Проверить</AlertDialogAction>
          </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
