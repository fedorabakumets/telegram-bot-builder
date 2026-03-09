/**
 * @fileoverview Компонент пустого состояния диалога
 * Отображается когда нет сообщений
 */

import { MessageSquare } from 'lucide-react';

/**
 * Компонент пустого диалога
 */
export function EmptyDialog() {
  return (
    <div
      className="flex flex-col items-center justify-center py-12 text-center"
      data-testid="empty-dialog-messages"
    >
      <MessageSquare className="w-12 h-12 text-muted-foreground mb-4" />
      <p className="text-muted-foreground text-sm">Нет сообщений</p>
      <p className="text-xs text-muted-foreground mt-1">
        Начните диалог, отправив первое сообщение
      </p>
    </div>
  );
}
