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
    <DialogHeader>
      <DialogTitle>Детали пользователя</DialogTitle>
      <DialogDescription>
        Подробная информация о пользователе
      </DialogDescription>
    </DialogHeader>
  );
}
