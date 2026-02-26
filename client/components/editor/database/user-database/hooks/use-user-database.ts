/**
 * @fileoverview Хуки для загрузки данных базы данных пользователей
 * @description Содержит useQuery хуки для получения пользователей, статистики и сообщений
 */

import { useQuery } from '@tanstack/react-query';
import { BotProject, UserBotData } from '@shared/schema';
import { BotMessageWithMedia, UserStats } from '../types';

/**
 * Параметры хука useUserDatabase
 */
interface UseUserDatabaseParams {
  /** Идентификатор проекта */
  projectId: number;
  /** Поисковый запрос */
  searchQuery: string;
  /** Флаг открытия диалога */
  showDialog: boolean;
  /** Флаг открытия деталей пользователя */
  showUserDetails: boolean;
  /** ID выбранного пользователя для диалога */
  selectedUserForDialogUserId?: string;
  /** ID выбранного пользователя для деталей */
  selectedUserId?: string;
}

/**
 * Возвращаемые значения хука useUserDatabase
 */
interface UseUserDatabaseReturn {
  project?: BotProject;
  users: UserBotData[];
  stats: UserStats;
  searchResults: UserBotData[];
  messages: BotMessageWithMedia[];
  userDetailsMessages: BotMessageWithMedia[];
  isLoading: boolean;
  isUsersLoading: boolean;
  isStatsLoading: boolean;
  isMessagesLoading: boolean;
  refetchUsers: () => void;
  refetchStats: () => void;
  refetchMessages: () => void;
}

/**
 * Хук для загрузки всех данных базы данных пользователей
 * @param params - Параметры хука
 * @returns Объект с данными и функциями обновления
 */
export function useUserDatabase(params: UseUserDatabaseParams): UseUserDatabaseReturn {
  const {
    projectId,
    searchQuery,
    showDialog,
    showUserDetails,
    selectedUserForDialogUserId,
    selectedUserId,
  } = params;

  // Загрузка данных проекта
  const { data: project } = useQuery<BotProject>({
    queryKey: [`/api/projects/${projectId}`],
  });

  // Загрузка списка пользователей
  const {
    data: users = [],
    isLoading: usersLoading,
    refetch: refetchUsers,
  } = useQuery<UserBotData[]>({
    queryKey: [`/api/projects/${projectId}/users`],
    staleTime: 0,
    gcTime: 0,
  });

  // Загрузка статистики пользователей
  const {
    data: stats = {},
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useQuery<UserStats>({
    queryKey: [`/api/projects/${projectId}/users/stats`],
    staleTime: 0,
    gcTime: 0,
  });

  // Поиск пользователей
  const { data: searchResults = [] } = useQuery<UserBotData[]>({
    queryKey: [`/api/projects/${projectId}/users/search`, searchQuery],
    enabled: searchQuery.length > 0,
    queryFn: async () => {
      const response = await fetch(
        `/api/projects/${projectId}/users/search?q=${encodeURIComponent(searchQuery)}`
      );
      return response.json();
    },
  });

  // Загрузка сообщений для диалога
  const {
    data: messages = [],
    isLoading: messagesLoading,
    refetch: refetchMessages,
  } = useQuery<BotMessageWithMedia[]>({
    queryKey: [`/api/projects/${projectId}/users/${selectedUserForDialogUserId}/messages`],
    enabled: showDialog && !!selectedUserForDialogUserId,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  // Загрузка сообщений для деталей пользователя
  const { data: userDetailsMessages = [] } = useQuery<BotMessageWithMedia[]>({
    queryKey: [`/api/projects/${projectId}/users/${selectedUserId}/messages`],
    enabled: showUserDetails && !!selectedUserId,
    staleTime: 0,
  });

  const isLoading = usersLoading || statsLoading;

  return {
    project,
    users,
    stats,
    searchResults,
    messages,
    userDetailsMessages,
    isLoading,
    isUsersLoading: usersLoading,
    isStatsLoading: statsLoading,
    isMessagesLoading: messagesLoading,
    refetchUsers,
    refetchStats,
    refetchMessages,
  };
}
