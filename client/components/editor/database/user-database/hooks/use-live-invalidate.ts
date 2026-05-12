/**
 * @fileoverview Хук real-time обновления статистики и списка пользователей.
 * Обрабатывает события new-message и new-user — мгновенно обновляет кэш (optimistic update),
 * затем синхронизирует данные с PostgreSQL через invalidateQueries.
 */

import { useEffect } from 'react';
import { useQueryClient, InfiniteData } from '@tanstack/react-query';
import {
  useUserMessagesLiveContext,
  NewMessageLiveEvent,
  NewUserLiveEvent,
  LiveEvent,
} from '../contexts/user-messages-live-context';
import { buildUsersApiUrl } from '@/components/editor/database/utils';
import { UserStats } from '../types';
import { UserBotData } from '@shared/schema';

/**
 * Параметры хука useLiveInvalidate
 */
interface UseLiveInvalidateParams {
  /** Идентификатор проекта */
  projectId: number;
  /** Идентификатор выбранного токена бота */
  selectedTokenId?: number | null;
}

/**
 * Структура страницы пользователей в кэше infinite-users
 */
interface UsersPageResponse {
  /** Список пользователей на странице */
  users: UserBotData[];
  /** Общее количество пользователей */
  total: number;
  /** Есть ли ещё страницы */
  hasMore: boolean;
}

/**
 * Мгновенно обновляет lastInteraction, interactionCount и lastMessageText пользователя в кэше,
 * и перемещает его в начало списка (сортировка по последней активности как в Telegram).
 * @param queryClient - Клиент React Query
 * @param projectId - Идентификатор проекта
 * @param normalizedTokenId - Нормализованный идентификатор токена
 * @param userId - Идентификатор пользователя
 * @param messageText - Текст последнего сообщения для обновления превью
 * @param messageAt - Время последнего сообщения
 */
function updateUserInCache(
  queryClient: ReturnType<typeof useQueryClient>,
  projectId: number,
  normalizedTokenId: number | null,
  userId: string,
  messageText?: string | null,
  messageAt?: Date,
): void {
  const now = messageAt ?? new Date();
  queryClient.setQueriesData<InfiniteData<UsersPageResponse>>(
    { queryKey: ['infinite-users', projectId] },
    (old) => {
      if (!old) return old;
      return {
        ...old,
        pages: old.pages.map((page, pageIndex) => {
          const userIndex = page.users.findIndex((u) => String(u.userId) === String(userId));
          if (userIndex === -1) return page;

          const updatedUser = {
            ...page.users[userIndex],
            lastInteraction: now,
            interactionCount: (page.users[userIndex].interactionCount ?? 0) + 1,
            // Обновляем поля превью последнего сообщения для DialogListItem
            ...(messageText !== undefined ? { lastMessageText: messageText } : {}),
            ...(messageAt !== undefined ? { lastMessageAt: messageAt } : {}),
          };

          // Убираем пользователя с текущей позиции
          const withoutUser = page.users.filter((_, i) => i !== userIndex);

          // На первой странице — перемещаем в начало (как в Telegram)
          // На остальных страницах — просто обновляем на месте
          const newUsers = pageIndex === 0
            ? [updatedUser, ...withoutUser]
            : [...withoutUser.slice(0, userIndex), updatedUser, ...withoutUser.slice(userIndex)];

          return { ...page, users: newUsers };
        }),
      };
    },
  );
}

/**
 * Мгновенно добавляет нового пользователя в первую страницу кэша infinite-users.
 * @param queryClient - Клиент React Query
 * @param projectId - Идентификатор проекта
 * @param normalizedTokenId - Нормализованный идентификатор токена
 * @param event - Событие new-user с данными пользователя
 */
function addNewUserToCache(
  queryClient: ReturnType<typeof useQueryClient>,
  projectId: number,
  normalizedTokenId: number | null,
  event: NewUserLiveEvent,
): void {
  const { data } = event;
  const newUser: UserBotData = {
    id: Date.now() * -1, // временный отрицательный id до refetch
    projectId,
    tokenId: event.tokenId ?? normalizedTokenId ?? 0,
    userId: Number(data.userId),
    userName: data.username ?? null,
    firstName: data.firstName ?? null,
    lastName: data.lastName ?? null,
    avatarUrl: data.avatarUrl ?? null,
    isBot: data.isBot ?? 0,
    isPremium: data.isPremium ?? 0,
    lastInteraction: new Date(data.registeredAt),
    interactionCount: 1,
    userData: {},
    currentState: null,
    preferences: {},
    commandsUsed: {},
    sessionsCount: 1,
    totalMessagesSent: 0,
    totalMessagesReceived: 0,
    deviceInfo: null,
    locationData: null,
    contactData: null,
    isBlocked: 0,
    isActive: 1,
    tags: [],
    notes: null,
    createdAt: new Date(data.registeredAt),
    updatedAt: new Date(data.registeredAt),
  };

  queryClient.setQueriesData<InfiniteData<UsersPageResponse>>(
    { queryKey: ['infinite-users', projectId] },
    (old) => {
      // Если кэш пустой (0 пользователей) — создаём начальную структуру
      const base: InfiniteData<UsersPageResponse> = old ?? {
        pages: [{ users: [], total: 0, hasMore: false }],
        pageParams: [0],
      };
      const [firstPage, ...rest] = base.pages;
      return {
        ...base,
        pages: [
          {
            ...firstPage,
            users: [newUser, ...firstPage.users],
            total: (firstPage.total ?? 0) + 1,
          },
          ...rest,
        ],
      };
    },
  );
}

/**
 * Хук real-time обновления статистики и списка пользователей.
 *
 * При new-message:
 *   - мгновенно инкрементирует totalInteractions и пересчитывает среднее
 *   - мгновенно обновляет lastInteraction и interactionCount пользователя в таблице
 *   - инвалидирует кэш для фонового refetch
 *
 * При new-user:
 *   - мгновенно добавляет пользователя в таблицу
 *   - мгновенно инкрементирует totalUsers и activeUsers в статистике
 *   - инвалидирует кэш для фонового refetch
 *
 * @param params - Параметры хука
 * @returns void
 */
export function useLiveInvalidate({ projectId, selectedTokenId }: UseLiveInvalidateParams): void {
  const queryClient = useQueryClient();
  const liveContext = useUserMessagesLiveContext();

  useEffect(() => {
    if (!liveContext) return;

    const statsUrl = buildUsersApiUrl(`/api/projects/${projectId}/users/stats`, selectedTokenId);
    const statsKey = [statsUrl, selectedTokenId];
    const normalizedTokenId = selectedTokenId ?? null;

    const unsubscribe = liveContext.subscribe((event: LiveEvent) => {
      if (event.type === 'new-message') {
        const msg = event as NewMessageLiveEvent;
        const userId = msg.data?.userId;

        // Optimistic update статистики
        queryClient.setQueryData<UserStats>(statsKey, (old) => {
          const newTotal = (old?.totalInteractions ?? 0) + 1;
          const users = old?.totalUsers ?? 1;
          return {
            ...(old ?? {}),
            totalInteractions: newTotal,
            avgInteractionsPerUser: Math.round((newTotal / users) * 100) / 100,
          };
        });

        // Optimistic update строки пользователя в таблице (перемещает наверх мгновенно)
        if (userId) {
          updateUserInCache(
            queryClient,
            projectId,
            normalizedTokenId,
            userId,
            msg.data.messageText ?? null,
            new Date(msg.data.createdAt),
          );
        }

        // Redis publish происходит строго после INSERT RETURNING в save_message_to_api,
        // поэтому данные уже в БД к моменту получения WS-события — задержка не нужна
        queryClient.invalidateQueries({ queryKey: statsKey });
        queryClient.invalidateQueries({
          queryKey: ['infinite-users', projectId],
          refetchType: 'all',
        });

        // Инвалидируем кэш активности сообщений — новое сообщение влияет на график.
        // queryKey в useMessagesActivity: ['messages-activity', projectId, tokenId, granularity]
        queryClient.invalidateQueries({
          predicate: (query) => {
            return query.queryKey[0] === 'messages-activity' && query.queryKey[1] === projectId;
          },
        });

        // Инвалидируем трафик при new-message — deep_link_param мог записаться в БД
        // чуть позже чем пришло событие new-user (race condition при первом визите)
        const trafficUrlOnMsg = buildUsersApiUrl(`/api/projects/${projectId}/users/traffic`, selectedTokenId);
        queryClient.invalidateQueries({ queryKey: [trafficUrlOnMsg, selectedTokenId] });
      }

      if (event.type === 'new-user') {
        const newUserEvent = event as NewUserLiveEvent;

        // Инвалидируем stats, growth и traffic — новый пользователь влияет на все три.
        // Делаем это ДО optimistic update чтобы запрос ушёл немедленно.
        const trafficUrl = buildUsersApiUrl(`/api/projects/${projectId}/users/traffic`, selectedTokenId);

        queryClient.invalidateQueries({ queryKey: statsKey });
        // Инвалидируем все гранулярности growth для данного проекта
        queryClient.invalidateQueries({ queryKey: ['users-growth', projectId, selectedTokenId] });
        queryClient.invalidateQueries({ queryKey: [trafficUrl, selectedTokenId] });
        queryClient.invalidateQueries({
          queryKey: ['infinite-users', projectId],
          refetchType: 'all',
        });

        // Optimistic update статистики — новый активный пользователь.
        // deepLinkUsers инкрементируем если в событии есть deepLinkParam.
        queryClient.setQueryData<UserStats>(statsKey, (old) => {
          const newTotalUsers = (old?.totalUsers ?? 0) + 1;
          const newActiveUsers = (old?.activeUsers ?? 0) + 1;
          const totalInteractions = old?.totalInteractions ?? 0;
          const hasDeepLink = !!(newUserEvent.data as any)?.deepLinkParam;
          return {
            ...(old ?? {}),
            totalUsers: newTotalUsers,
            activeUsers: newActiveUsers,
            avgInteractionsPerUser: Math.round((totalInteractions / newTotalUsers) * 100) / 100,
            deepLinkUsers: (old?.deepLinkUsers ?? 0) + (hasDeepLink ? 1 : 0),
          };
        });

        // Мгновенно добавляем пользователя в таблицу
        addNewUserToCache(queryClient, projectId, normalizedTokenId, newUserEvent);

        // Повторная инвалидация трафика через 1.5с — на случай race condition
        // между Redis publish и записью deep_link_param в БД
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: [trafficUrl, selectedTokenId] });
          queryClient.invalidateQueries({ queryKey: statsKey });
        }, 1500);
      }
    });

    return unsubscribe;
  }, [projectId, selectedTokenId, queryClient, liveContext]);
}
