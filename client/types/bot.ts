/**
 * @fileoverview Клиентские типы бота и алиасы shared/schema
 * @module client/types/bot
 */

import {
  Node as SharedNode,
  Button as SharedButton,
  BotProject,
  BotInstance,
  BotTemplate,
  BotToken,
  MediaFile,
  BotUser,
  BotGroup,
  GroupMember,
  UserTelegramSettings,
  BotMessage,
  BotMessageMedia,
  ComponentDefinition as SharedComponentDefinition,
} from '@shared/schema';

/** Данные пользователя или чата бота в формате API клиента */
export interface UserBotData {
  /** Идентификатор пользователя или чата в Telegram */
  userId: string | number;
  /** Идентификатор проекта */
  projectId?: number;
  /** Идентификатор токена бота */
  tokenId?: number;
  /** Имя пользователя в Telegram (@username без @) */
  userName?: string | null;
  /** Имя */
  firstName?: string | null;
  /** Фамилия */
  lastName?: string | null;
  /** URL аватарки */
  avatarUrl?: string | null;
  /** Дата регистрации */
  registeredAt?: Date | string | null;
  /** Дата создания записи */
  createdAt?: Date | string | null;
  /** Дата последнего взаимодействия */
  lastInteraction?: Date | string | null;
  /** Количество взаимодействий */
  interactionCount?: number;
  /** Пользователь активен */
  isActive?: boolean | number;
  /** Пользователь Premium */
  isPremium?: boolean | number;
  /** Пользователь заблокировал бота */
  isBlocked?: boolean;
  /** Это бот */
  isBot?: boolean | number;
  /** Код языка */
  languageCode?: string | null;
  /** Deep link параметр */
  deepLinkParam?: string | null;
  /** ID реферера */
  referrerId?: string | null;
  /** Произвольные данные пользователя */
  userData?: Record<string, unknown>;
  /** Текст последнего сообщения */
  lastMessageText?: string | null;
  /** Время последнего сообщения */
  lastMessageAt?: Date | string | null;
  /** Это групповой чат */
  isGroup?: boolean;
  /** Тип чата Telegram */
  chatType?: string | null;
}

export type {
  SharedNode as Node,
  SharedButton as Button,
  BotProject,
  BotInstance,
  BotTemplate,
  BotToken,
  MediaFile,
  BotUser,
  BotGroup,
  GroupMember,
  UserTelegramSettings,
  BotMessage,
  BotMessageMedia,
  SharedComponentDefinition as ComponentDefinition,
};

/** Расширенное определение компонента с позицией на канвасе */
export interface ExtendedComponentDefinition extends SharedComponentDefinition {
  /** Позиция на канвасе */
  position: { x: number; y: number };
  /** Данные компонента */
  data: unknown;
}

/** Временный тип данных бота */
export type BotData = unknown;
