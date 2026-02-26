/**
 * @fileoverview Хуки компонента UserDatabasePanel
 * @description useUserDatabase и useUserMutations для загрузки данных и мутаций
 */

import { useUserDatabase, useUserMutations } from '../hooks';
import { UseUserDatabaseParams, UseUserMutationsParams } from './panel-types';

/**
 * Пропсы для хука useUserDatabasePanelData
 */
interface UseUserDatabasePanelDataParams extends UseUserDatabaseParams {
  /** Поисковый запрос */
  searchQuery: string;
  /** Флаг открытия диалога */
  showDialog: boolean;
  /** Флаг открытия деталей */
  showUserDetails: boolean;
  /** ID пользователя для диалога */
  selectedUserForDialogUserId?: string;
  /** ID пользователя для деталей */
  selectedUserId?: string;
}

/**
 * Пропсы для хука useUserDatabasePanelMutations
 */
interface UseUserDatabasePanelMutationsParams extends UseUserMutationsParams {
  /** Функция обновления пользователей */
  refetchUsers: () => void;
  /** Функция обновления статистики */
  refetchStats: () => void;
}

/**
 * Результат хука useUserDatabasePanelData
 */
interface UseUserDatabasePanelDataReturn {
  /** Данные проекта */
  project: any;
  /** Список пользователей */
  users: any[];
  /** Статистика */
  stats: any;
  /** Результаты поиска */
  searchResults: any[];
  /** Сообщения */
  messages: any[];
  /** Сообщения деталей */
  userDetailsMessages: any[];
  /** Флаг загрузки */
  isLoading: boolean;
  /** Флаг загрузки сообщений */
  isMessagesLoading: boolean;
  /** Функция обновления пользователей */
  refetchUsers: () => void;
  /** Функция обновления статистики */
  refetchStats: () => void;
  /** Функция обновления сообщений */
  refetchMessages: () => void;
}

/**
 * Результат хука useUserDatabasePanelMutations
 */
interface UseUserDatabasePanelMutationsReturn {
  /** Мутация удаления пользователя */
  deleteUserMutation: any;
  /** Мутация обновления пользователя */
  updateUserMutation: any;
  /** Мутация удаления всех */
  deleteAllUsersMutation: any;
  /** Мутация переключения БД */
  toggleDatabaseMutation: any;
  /** Мутация отправки сообщения */
  sendMessageMutation: any;
}

/**
 * Хук для загрузки данных панели БД
 * @param params - Параметры хука
 * @returns Объект с данными и функциями
 */
export function useUserDatabasePanelData(
  params: UseUserDatabasePanelDataParams
): UseUserDatabasePanelDataReturn {
  const {
    projectId,
    searchQuery,
    showDialog,
    showUserDetails,
    selectedUserForDialogUserId,
    selectedUserId,
  } = params;

  return useUserDatabase({
    projectId,
    searchQuery,
    showDialog,
    showUserDetails,
    selectedUserForDialogUserId,
    selectedUserId,
  });
}

/**
 * Хук для мутаций панели БД
 * @param params - Параметры хука
 * @returns Объект с мутациями
 */
export function useUserDatabasePanelMutations(
  params: UseUserDatabasePanelMutationsParams
): UseUserDatabasePanelMutationsReturn {
  const { projectId, refetchUsers, refetchStats } = params;

  return useUserMutations({
    projectId,
    refetchUsers,
    refetchStats,
  });
}
