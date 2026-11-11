/**
 * @fileoverview Компонент заголовка диалога деталей пользователя
 * @description Отображает заголовок и описание диалога
 */

import { DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

/**
 * Компонент заголовка диалога деталей
 * @returns JSX компонент заголовка
 */
export function UserDetailsHeader(): React.JSX.Element {
  return (
    <DialogHeader className="shrink-0 border-b border-border/60 pb-4 pr-8 text-left">
      <DialogTitle>Профиль пользователя</DialogTitle>
      <DialogDescription>
        Данные Telegram, история активности и ответы боту
      </DialogDescription>
    </DialogHeader>
  );
}
