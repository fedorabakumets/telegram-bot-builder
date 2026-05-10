/**
 * @fileoverview Компонент переключателя статуса пользователя
 * @description Переключатель активности/блокировки — скрыт из UI (данные сохраняются)
 */

import { UserBotData } from '@shared/schema';

/**
 * Пропсы компонента UserStatusToggle
 */
interface UserStatusToggleProps {
  /** Данные пользователя */
  selectedUser: UserBotData;
  /** Функция переключения статуса */
  handleUserStatusToggle: (user: UserBotData, field: 'isActive' | 'isBlocked' | 'isPremium') => void;
}

/**
 * Компонент переключателя статуса — скрыт из UI
 * @param props - Пропсы компонента
 * @returns Пустой фрагмент
 */
export function UserStatusToggle({
  selectedUser: _selectedUser,
  handleUserStatusToggle: _handleUserStatusToggle,
}: UserStatusToggleProps): React.JSX.Element {
  // Активен/Заблокирован скрыто из UI — поля is_active, is_blocked продолжают писаться в БД
  return <></>;
}
