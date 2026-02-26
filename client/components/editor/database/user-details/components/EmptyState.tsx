/**
 * @fileoverview Компонент пустого состояния панели
 * @description Отображается, когда пользователь не выбран
 */

import React from 'react';
import { User } from 'lucide-react';

/**
 * Компонент пустого состояния
 * @returns {JSX.Element} Элемент с сообщением о выборе пользователя
 */
export function EmptyState(): React.JSX.Element {
  return (
    <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-4">
      <User className="w-12 h-12 mb-4" />
      <p className="text-center">Выберите пользователя для просмотра деталей</p>
    </div>
  );
}
