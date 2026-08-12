/**
 * @fileoverview Кнопки действий над большой рассылкой в ленте (правка, остановка, удаление)
 * @module editor/database/dialog/components/campaign-bubble-actions
 */

import { Loader2, Pencil, Square, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Пропсы компонента CampaignBubbleActions
 */
interface CampaignBubbleActionsProps {
  /** Показывать ли кнопку редактирования текста */
  showEdit: boolean;
  /** Показывать ли кнопку удаления */
  showDelete: boolean;
  /** Идёт ли ещё отправка хотя бы у одного бота */
  isRunning: boolean;
  /** Идёт ли удаление рассылки */
  isDeleting?: boolean;
  /** Идёт ли остановка рассылки */
  isStopping?: boolean;
  /** Обработчик перехода в режим правки текста */
  onStartEdit: () => void;
  /** Обработчик остановки рассылки у всех ботов */
  onStopAll: () => void;
  /** Обработчик запроса удаления рассылки */
  onRequestDelete: () => void;
}

/**
 * Вертикальная колонка кнопок действий рядом с пузырём большой рассылки.
 *
 * @param props - Свойства компонента
 * @returns JSX элемент с кнопками действий
 */
export function CampaignBubbleActions({
  showEdit,
  showDelete,
  isRunning,
  isDeleting,
  isStopping,
  onStartEdit,
  onStopAll,
  onRequestDelete,
}: CampaignBubbleActionsProps) {
  return (
    <div className="flex flex-col gap-0.5 self-center mr-1">
      {showEdit && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0 text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10"
          onClick={onStartEdit}
          title="Изменить текст у всех ботов"
        >
          <Pencil className="h-3 w-3" />
        </Button>
      )}
      {showEdit && isRunning && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0 text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10"
          onClick={onStopAll}
          disabled={isStopping}
          title="Остановить у всех ботов"
        >
          {isStopping ? <Loader2 className="h-3 w-3 animate-spin" /> : <Square className="h-3 w-3" />}
        </Button>
      )}
      {showDelete && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={onRequestDelete}
          disabled={isDeleting}
          title="Удалить рассылку у всех ботов"
        >
          {isDeleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
        </Button>
      )}
    </div>
  );
}
