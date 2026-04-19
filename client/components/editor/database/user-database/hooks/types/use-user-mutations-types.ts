/**
 * @fileoverview Типы для хука useUserMutations
 * @description Интерфейсы параметров и возвращаемых значений мутаций
 */

/**
 * Параметры для мутаций пользователей
 */
export interface UseUserMutationsParams {
  /** Идентификатор проекта */
  projectId: number;
  /** Идентификатор выбранного токена бота */
  selectedTokenId?: number | null;
  /** Функция обновления списка пользователей */
  refetchUsers: () => void;
  /** Функция обновления статистики */
  refetchStats: () => void;
}

/**
 * Возвращаемые значения мутаций
 */
export interface UseUserMutationsReturn {
  /** Мутация удаления пользователя */
  deleteUserMutation: any;
  /** Мутация обновления данных пользователя */
  updateUserMutation: any;
  /** Мутация удаления всех пользователей */
  deleteAllUsersMutation: any;
  /** Мутация переключения базы данных */
  toggleDatabaseMutation: any;
}
