/**
 * @fileoverview Кнопка запуска массовой проверки доступов с подтверждением.
 * @module client/components/editor/analytics/analytics-access-check-button
 */
import { CheckBotScopeSelect } from '@/components/editor/database/user-database/components/check-history/check-bot-scope-select';
import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import type { BotToken } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { CheckHistoryContent } from '@/components/editor/database/user-database/components/check-history/check-history-content';
import { CheckScheduleSettings } from '@/components/editor/database/user-database/components/check-history/check-schedule-settings';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

/** Подсказка о кратком статусе «печатает…». */
export const ACCESS_CHECK_TYPING_HINT = 'Во время проверки пользователь может на несколько секунд увидеть статус «печатает…» от бота. Сообщения отправлены не будут.';

/**
 * Пропсы кнопки проверки.
 */
interface AnalyticsAccessCheckButtonProps {
  /** Проект истории проверок. */
  projectId: number;
  /** Дополнительный стиль портального подтверждения. */
  overlayClassName?: string;
  /** Боты проекта для выбора внутри диалога проверки. */
  tokens: BotToken[];
  /** Бот, доступы которого будут проверяться. */
  selectedTokenId: number | 'all' | null;
  /** Выбрать бота только для проверки, не меняя общую аналитику. */
  onSelectToken: (id: number | 'all') => void;
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
 * Текстовое действие проверки с одним контуром фокуса и диалогом подтверждения.
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function AnalyticsAccessCheckButton({ projectId, tokens, selectedTokenId, onSelectToken, totalUsers, pending, disabled, onConfirm, overlayClassName }: AnalyticsAccessCheckButtonProps) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="analytics-access-check-trigger"
        disabled={pending}
        aria-busy={pending}
        title={disabled ? 'Добавьте бота в проект' : undefined}
        onClick={() => setOpen(true)}
      >
        {/** Иконка обозначает личные чаты и не дублируется в доступном названии кнопки. */}
        <MessageSquare className="h-4 w-4 shrink-0" aria-hidden="true" />
        {pending ? 'Запускаем проверку…' : 'Проверить личные чаты'}
      </Button>
      {/** Обычное окно закрывается крестиком, клавишей Escape и кликом по затемнению. */}
      <DialogContent className={`analytics-overlay max-h-[85vh] gap-3 overflow-y-auto p-5 sm:max-w-xl ${overlayClassName ?? ''}`}>
          <DialogHeader className="pr-6">
            <DialogTitle>Проверка личных чатов</DialogTitle>
            <DialogDescription>
              В базе {totalUsers.toLocaleString('ru-RU')} человек. Проверим только подтверждённые личные обращения и обновим профили. Без сообщений; возможен статус «печатает…».
            </DialogDescription>
          </DialogHeader>
          <CheckBotScopeSelect tokens={tokens} value={selectedTokenId} onChange={onSelectToken} />
          {/** Запуск расположен перед историей, чтобы не искать его под прошлыми результатами. */}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Отмена</Button>
            <Button type="button" disabled={pending || disabled || !selectedTokenId} onClick={() => { setOpen(false); onConfirm(); }}>Проверить</Button>
          </DialogFooter>
          {/** Расписание сохраняется отдельно от ручного запуска для выбранной области. */}
          <CheckScheduleSettings key={`${projectId}:${selectedTokenId}`} projectId={projectId} tokenId={typeof selectedTokenId === 'number' ? selectedTokenId : null} kind="private-chats" enabled={open} />
          {/** История загружается прямо в окне запуска и не вызывает новую проверку. */}
          <CheckHistoryContent projectId={projectId} tokenId={typeof selectedTokenId === 'number' ? selectedTokenId : null} kind="private-chats" enabled={open} />
      </DialogContent>
    </Dialog>
  );
}
