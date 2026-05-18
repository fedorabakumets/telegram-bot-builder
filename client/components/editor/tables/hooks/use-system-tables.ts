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

/** Колонки системной таблицы медиафайлов */
const MEDIA_COLUMNS: TableColumn[] = [
  { id: 'file_name', name: 'file_name' },
  { id: 'file_type', name: 'file_type' },
  { id: 'file_size', name: 'file_size' },
  { id: 'url', name: 'url' },
  { id: 'created_at', name: 'created_at' },
];

/** Колонки системной таблицы токенов бота */
const TOKENS_COLUMNS: TableColumn[] = [
  { id: 'name', name: 'name' },
  { id: 'bot_username', name: 'bot_username' },
  { id: 'is_active', name: 'is_active' },
  { id: 'last_used_at', name: 'last_used_at' },
];

/** Колонки системной таблицы рассылок */
const BROADCASTS_COLUMNS: TableColumn[] = [
  { id: 'text', name: 'text' },
  { id: 'status', name: 'status' },
  { id: 'sent_count', name: 'sent_count' },
  { id: 'created_at', name: 'created_at' },
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

/** Интерфейс ответа API рассылок (пагинированный режим) */
interface BroadcastsApiResponse {
  /** Массив рассылок */
  broadcasts: any[];
  /** Общее количество */
  total: number;
  /** Текущая страница */
  page: number;
  /** Лимит на страницу */
  limit: number;
}

/**
 * Форматирует размер файла в читаемый вид (KB/MB)
 * @param bytes - Размер в байтах
 * @returns Отформатированная строка размера
 */
function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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

  /** Загрузка медиафайлов */
  const { data: mediaData } = useQuery<any[]>({
    queryKey: ['system-tables-media', projectId],
    queryFn: () => apiRequest('GET', `/api/media/project/${projectId}`),
    enabled: !!projectId,
    refetchInterval: 30000,
  });

  /** Загрузка токенов бота */
  const { data: tokensData } = useQuery<any[]>({
    queryKey: ['system-tables-tokens', projectId],
    queryFn: () => apiRequest('GET', `/api/projects/${projectId}/tokens`),
    enabled: !!projectId,
    refetchInterval: 30000,
  });

  /** Загрузка рассылок */
  const { data: broadcastsData } = useQuery<BroadcastsApiResponse>({
    queryKey: ['system-tables-broadcasts', projectId],
    queryFn: () => apiRequest('GET', `/api/projects/${projectId}/broadcasts?limit=100`),
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

    // Медиафайлы
    const media = Array.isArray(mediaData) ? mediaData : [];

    const mediaRows: TableRow[] = media.map((f: any, i: number) => ({
      id: i + 1,
      rowIndex: i + 1,
      cells: {
        file_name: f.fileName || f.file_name || '',
        file_type: f.fileType || f.file_type || '',
        file_size: formatFileSize(f.fileSize || f.file_size || 0),
        url: f.url || '',
        created_at: f.createdAt || f.created_at
          ? new Date(f.createdAt || f.created_at).toLocaleString('ru')
          : '',
      },
    }));

    // Токены бота
    const tokens = Array.isArray(tokensData) ? tokensData : [];

    const tokensRows: TableRow[] = tokens.map((t: any, i: number) => ({
      id: i + 1,
      rowIndex: i + 1,
      cells: {
        name: t.name || '',
        bot_username: t.botUsername || t.bot_username || '',
        is_active: t.isActive || t.is_active ? 'да' : 'нет',
        last_used_at: t.lastUsedAt || t.last_used_at
          ? new Date(t.lastUsedAt || t.last_used_at).toLocaleString('ru')
          : '—',
      },
    }));

    // Рассылки
    const broadcasts = Array.isArray(broadcastsData)
      ? broadcastsData
      : (broadcastsData as BroadcastsApiResponse)?.broadcasts || [];

    const broadcastsRows: TableRow[] = broadcasts.map((b: any, i: number) => ({
      id: i + 1,
      rowIndex: i + 1,
      cells: {
        text: (b.text || b.message || '').slice(0, 50),
        status: b.status || '',
        sent_count: String(b.sentCount || b.sent_count || 0),
        created_at: b.createdAt || b.created_at
          ? new Date(b.createdAt || b.created_at).toLocaleString('ru')
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
      {
        id: '_system_media',
        name: '🔒 Медиафайлы',
        columns: MEDIA_COLUMNS,
        rows: mediaRows,
      },
      {
        id: '_system_tokens',
        name: '🔒 Токены бота',
        columns: TOKENS_COLUMNS,
        rows: tokensRows,
      },
      {
        id: '_system_broadcasts',
        name: '🔒 Рассылки',
        columns: BROADCASTS_COLUMNS,
        rows: broadcastsRows,
      },
    ];
  }, [usersData, messagesData, groupsData, mediaData, tokensData, broadcastsData]);

  return systemTables;
}
