/**
 * @fileoverview Кнопка запуска массовой проверки доступов с подтверждением.
 * @module client/components/editor/analytics/analytics-access-check-button
 */
import { useState } from 'react';
import type { BotToken } from '@shared/schema';
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
  /** Боты проекта для выбора внутри диалога проверки. */
  tokens: BotToken[];
  /** Бот, доступы которого будут проверяться. */
  selectedTokenId: number | null;
  /** Выбрать бота только для проверки, не меняя общую аналитику. */
  onSelectToken: (id: number) => void;
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
 * Доступная кнопка проверки и диалог с читаемым описанием её действия.
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function AnalyticsAccessCheckButton({ tokens, selectedTokenId, onSelectToken, totalUsers, pending, disabled, onConfirm }: AnalyticsAccessCheckButtonProps) {
  const [open, setOpen] = useState(false);
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-10 shrink-0 gap-2 px-3 text-sm font-semibold"
        disabled={pending || disabled}
        aria-busy={pending}
        title={disabled ? 'Добавьте бота в проект' : undefined}
        onClick={() => setOpen(true)}
      >
        <ShieldCheck className="h-4 w-4" aria-hidden="true" />
        {pending ? 'Запускаем проверку…' : 'Проверить доступы'}
      </Button>
      <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Проверить доступы</AlertDialogTitle>
            <AlertDialogDescription>
              В карточке {totalUsers.toLocaleString('ru-RU')} человек. Проверка выполняется для выбранного ниже бота и только по его личным диалогам. Кто писал лишь в группе или канале, не входит. {ACCESS_CHECK_TYPING_HINT}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <label className="flex flex-col gap-2 text-sm font-medium">
            Бот для проверки
            <select aria-label="Бот для проверки" className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
              value={selectedTokenId ?? ''} onChange={event => onSelectToken(Number(event.target.value))}>
              <option value="" disabled>Выберите бота</option>
              {tokens.map(token => <option key={token.id} value={token.id}>{token.botUsername ? `@${token.botUsername}` : token.botFirstName || token.name || `Бот №${token.id}`}</option>)}
            </select>
          </label>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction disabled={pending || !selectedTokenId} onClick={onConfirm}>Проверить</AlertDialogAction>
          </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
