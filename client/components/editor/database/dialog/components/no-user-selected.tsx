/**
 * @fileoverview Компонент отсутствия выбранного пользователя
 * Отображается когда пользователь не выбран
 */

import { MessageSquare } from 'lucide-react';

/**
 * Компонент отсутствия пользователя
 */
export function NoUserSelected() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-4">
      <MessageSquare className="w-12 h-12 mb-4" />
      <p className="text-center">Выберите пользователя для просмотра диалога</p>
    </div>
  );
}
