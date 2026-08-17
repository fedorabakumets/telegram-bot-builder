/**
 * @fileoverview Кнопки правки и удаления пузыря одиночной рассылки
 * @module editor/database/dialog/components/broadcast-bubble-actions
 */

import { Loader2, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Пропсы кнопок действий одиночной рассылки
 */
interface BroadcastBubbleActionsProps {
  /** Показать кнопку правки */
  showEdit: boolean;
  /** Показать кнопку удаления */
  showDelete: boolean;
  /** Идёт удаление */
  isDeleting: boolean;
  /** Начать правку */
  onStartEdit: () => void;
  /** Удалить рассылку */
  onDelete: () => void;
}

/**
 * Иконки слева от пузыря: правка и удаление
 * @param props - Свойства кнопок
 * @returns JSX элемент
 */
export function BroadcastBubbleActions({
  showEdit,
  showDelete,
  isDeleting,
  onStartEdit,
  onDelete,
}: BroadcastBubbleActionsProps) {
  if (!showEdit && !showDelete) return null;

  return (
    <div className="mr-1 flex flex-col gap-0.5 self-center">
      {showEdit && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0 text-muted-foreground hover:bg-blue-500/10 hover:text-blue-500"
          onClick={onStartEdit}
          title="Редактировать рассылку"
        >
          <Pencil className="h-3 w-3" />
        </Button>
      )}
      {showDelete && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          onClick={onDelete}
          disabled={isDeleting}
          title="Удалить рассылку"
        >
          {isDeleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
        </Button>
      )}
    </div>
  );
}
