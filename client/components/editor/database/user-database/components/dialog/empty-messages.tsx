/**
 * @fileoverview Компонент пустого состояния сообщений
 * @description Отображается когда нет сообщений в диалоге
 */

import { MessageSquare } from 'lucide-react';

/**
 * Компонент пустого состояния сообщений
 * @returns JSX компонент пустого состояния
 */
export function EmptyMessages(): React.JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <MessageSquare className="w-12 h-12 text-muted-foreground mb-4" />
      <p className="text-muted-foreground">Нет сообщений</p>
      <p className="text-sm text-muted-foreground mt-1">
        Начните диалог, отправив первое сообщение
      </p>
    </div>
  );
}
