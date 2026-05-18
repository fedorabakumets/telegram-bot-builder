/**
 * @fileoverview Хук загрузки системных (виртуальных) таблиц из существующих API
 * @module editor/tables/hooks/use-system-tables
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/queryClient';
import type { BotTable, TableColumn, TableRow } from '../types';

/** Колонки системной таблицы пользователей */
const USERS_COLUMNS: TableColumn[] = [
  { id: 'user_id', name: 'user_id' },
  { id: 'username', name: 'username' },
  { id: 'first_name', name: 'first_name' },
  { id: 'last_interaction', name: 'last_interaction' },
  { id: 'interaction_count', name: 'interactions' },
];

/** Колонки системной таблицы сообщений */
const MESSAGES_COLUMNS: TableColumn[] = [
  { id: 'userId', name: 'user_id' },
  { id: 'messageType', name: 'type' },
  { id: 'messageText', name: 'text' },
  { id: 'chatType', name: 'chat_type' },
  { id: 'createdAt', name: 'time' },
];

/** Колонки системной таблицы групп */
const GROUPS_COLUMNS: TableColumn[] = [
  { id: 'group_id', name: 'group_id' },
  { id: 'name', name: 'name' },
  { id: 'member_count', name: 'members' },
  { id: 'chat_type', name: 'type' },
  { id: 'last_activity', name: 'last_activity' },
];

/** Интерфейс ответа API пользователей (пагинированный режим) */
interface UsersApiResponse {
  /** Массив пользователей */
  users: any[];
  /** Общее количество */
  total: number;
  /** Есть ли ещё записи */
  hasMore: boolean;
}

/**
 * Хук загрузки системных таблиц (read-only) из существующих API проекта
 * @param projectId - Идентификатор проекта
 * @returns Массив виртуальных BotTable для отображения в списке таблиц
 */
export function useSystemTables(projectId: number): BotTable[] {
  /** Загрузка пользователей */
  const { data: usersData } = useQuery<UsersApiResponse | any[]>({
    queryKey: ['system-tables-users', projectId],
    queryFn: () => apiRequest('GET', `/api/projects/${projectId}/users?limit=200`),
    enabled: !!projectId,
    refetchInterval: 10000,
  });

  /** Загрузка сообщений */
  const { data: messagesData } = useQuery<any[]>({
    queryKey: ['system-tables-messages', projectId],
    queryFn: () => apiRequest('GET', `/api/projects/${projectId}/messages/all?limit=200`),
    enabled: !!projectId,
    refetchInterval: 10000,
  });

  /** Загрузка групп */
  const { data: groupsData } = useQuery<any[]>({
    queryKey: ['system-tables-groups', projectId],
    queryFn: () => apiRequest('GET', `/api/projects/${projectId}/groups`),
    enabled: !!projectId,
    refetchInterval: 15000,
  });

  /** Преобразуем данные в формат BotTable */
  const systemTables = useMemo<BotTable[]>(() => {
    // Пользователи
    const users = Array.isArray(usersData)
      ? usersData
      : (usersData as UsersApiResponse)?.users || [];

    const usersRows: TableRow[] = users.map((u: any, i: number) => ({
      id: i + 1,
      rowIndex: i + 1,
      cells: {
        user_id: String(u.userId || ''),
        username: u.userName || '',
        first_name: u.firstName || '',
        last_interaction: u.lastInteraction
          ? new Date(u.lastInteraction).toLocaleString('ru')
          : '',
        interaction_count: String(u.interactionCount || 0),
      },
    }));

    // Сообщения
    const messages = Array.isArray(messagesData) ? messagesData : [];

    const messagesRows: TableRow[] = messages.map((m: any, i: number) => ({
      id: i + 1,
      rowIndex: i + 1,
      cells: {
        userId: String(m.userId || ''),
        messageType: m.messageType || '',
        messageText: m.messageText || '',
        chatType: m.chatType || 'private',
        createdAt: m.createdAt
          ? new Date(m.createdAt).toLocaleString('ru')
          : '',
      },
    }));

    // Группы
    const groups = Array.isArray(groupsData) ? groupsData : [];

    const groupsRows: TableRow[] = groups.map((g: any, i: number) => ({
      id: i + 1,
      rowIndex: i + 1,
      cells: {
        group_id: String(g.groupId || g.group_id || ''),
        name: g.name || '',
        member_count: String(g.memberCount || g.member_count || 0),
        chat_type: g.chatType || g.chat_type || 'group',
        last_activity: g.lastActivity || g.last_activity
          ? new Date(g.lastActivity || g.last_activity).toLocaleString('ru')
          : '',
      },
    }));

    return [
      {
        id: '_system_users',
        name: '🔒 Пользователи',
        columns: USERS_COLUMNS,
        rows: usersRows,
      },
      {
        id: '_system_messages',
        name: '🔒 Сообщения',
        columns: MESSAGES_COLUMNS,
        rows: messagesRows,
      },
      {
        id: '_system_groups',
        name: '🔒 Группы',
        columns: GROUPS_COLUMNS,
        rows: groupsRows,
      },
    ];
  }, [usersData, messagesData, groupsData]);

  return systemTables;
}
