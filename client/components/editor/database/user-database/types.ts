import { BotMessage, UserBotData } from '@shared/schema';

/**
 * BotMessage с дополнительными медиа-данными
 */
export type BotMessageWithMedia = BotMessage & {
  media?: Array<{
    id: number;
    url: string;
    type: string;
    width?: number;
    height?: number;
  }>;
};

/**
 * Свойства компонента UserDatabasePanel
 */
export interface UserDatabasePanelProps {
  projectId: number;
  projectName: string;
  onOpenDialogPanel?: (user: UserBotData) => void;
  onOpenUserDetailsPanel?: (user: UserBotData) => void;
}

/**
 * Возможные поля для сортировки пользователей
 */
export type SortField = 'lastInteraction' | 'interactionCount' | 'createdAt' | 'firstName' | 'userName';

/**
 * Направления сортировки
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Статистика пользователей
 */
export interface UserStats {
  totalUsers?: number;
  activeUsers?: number;
  blockedUsers?: number;
  premiumUsers?: number;
  totalInteractions?: number;
  avgInteractionsPerUser?: number;
  usersWithResponses?: number;
}

/**
 * Данные ответа пользователя
 */
export interface ResponseData {
  value?: string;
  type?: string;
  prompt?: string;
  timestamp?: Date | string;
  nodeId?: string | number;
  photoUrl?: string;
  media?: Array<{ url: string } | string>;
  [key: string]: unknown;
}

/**
 * Карта соответствия переменных вопросам
 */
export type VariableToQuestionMap = Record<string, string>;

/**
 * Счётчик сообщений пользователя
 */
export interface UserMessageCounts {
  userSent: number;
  botSent: number;
  total: number;
}
