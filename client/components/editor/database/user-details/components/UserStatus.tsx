/**
 * @fileoverview Компонент статуса пользователя
 * @description Переключатель активности — скрыт из UI (данные сохраняются)
 */

import React from 'react';
import { UserBotData } from '@shared/schema';

/**
 * @interface UserStatusProps
 * @description Свойства компонента статуса
 */
interface UserStatusProps {
  /** Данные пользователя */
  user: UserBotData;
  /** Функция переключения статуса */
  onToggle: (field: 'isActive') => void;
}

/**
 * Компонент статуса пользователя — скрыт из UI
 * @param props - Свойства компонента
 * @returns Пустой фрагмент
 */
export function UserStatus({ user: _user, onToggle: _onToggle }: UserStatusProps): React.JSX.Element {
  // Активен/Неактивен скрыто из UI — поле is_active продолжает писаться в БД
  return <></>;
}
