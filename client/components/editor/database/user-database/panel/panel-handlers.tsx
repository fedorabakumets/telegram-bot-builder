/**
 * @fileoverview Обработчики событий компонента UserDatabasePanel
 * @description Функции для управления пользователями
 */

import { UserBotData } from '@shared/schema';

/**
 * Пропсы для хука useUserDatabasePanelHandlers
 */
interface UseUserDatabasePanelHandlersParams {
  /** Мутация обновления пользователя */
  updateUserMutation: any;
  /** Функция для уведомлений */
  toast: any;
}

/**
 * Результат хука useUserDatabasePanelHandlers
 */
interface UseUserDatabasePanelHandlersReturn {
  /** Переключение статуса пользователя */
  handleUserStatusToggle: (
    user: UserBotData,
    field: 'isActive' | 'isBlocked' | 'isPremium'
  ) => void;
}

/**
 * Хук для создания обработчиков событий
 * @param params - Параметры хука
 * @returns Объект с обработчиками
 */
export function useUserDatabasePanelHandlers(
  params: UseUserDatabasePanelHandlersParams,
  _userDetailsMessages: undefined
): UseUserDatabasePanelHandlersReturn {
  const { updateUserMutation, toast } = params;

  /**
   * Переключение статуса пользователя
   */
  const handleUserStatusToggle = (
    user: UserBotData,
    field: 'isActive' | 'isBlocked' | 'isPremium'
  ) => {
    const currentValue = user[field];
    const newValue = currentValue === 1 ? 0 : 1;
    const userId = user.id;

    if (!userId) {
      console.error('User ID not found');
      return;
    }

    if (field === 'isActive') {
      updateUserMutation.mutate({
        userId: userId,
        data: { [field]: newValue },
      });
    } else {
      toast({
        title: 'Функция недоступна',
        description: `Изменение статуса "${field}" пока не поддерживается`,
        variant: 'destructive',
      });
    }
  };

  return {
    handleUserStatusToggle,
  };
}
