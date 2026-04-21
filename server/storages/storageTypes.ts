/**
 * @fileoverview Локальные типы server-слоя для записи данных в таблицы Drizzle
 * @module server/storages/storageTypes
 */

import {
  botGroups,
  botInstances,
  botLaunchHistory,
  botLogs,
  botMessageMedia,
  botMessages,
  botProjects,
  botTemplates,
  botTokens,
  groupMembers,
  mediaFiles,
  telegramUsers,
  userBotData,
} from "@shared/schema";

/** Тип вставки проекта бота по таблице Drizzle */
export type StorageBotProjectInput = typeof botProjects.$inferInsert;

/** Тип обновления проекта бота с серверным служебным флагом */
export type StorageBotProjectUpdate = Partial<StorageBotProjectInput> & {
  /** Флаг перезапуска бота после обновления проекта */
  restartOnUpdate?: boolean;
};

/** Тип вставки экземпляра бота по таблице Drizzle */
export type StorageBotInstanceInput = typeof botInstances.$inferInsert;

/** Тип обновления экземпляра бота */
export type StorageBotInstanceUpdate = Partial<StorageBotInstanceInput>;

/** Тип вставки токена бота по таблице Drizzle */
export type StorageBotTokenInput = typeof botTokens.$inferInsert;

/** Тип обновления токена бота */
export type StorageBotTokenUpdate = Partial<StorageBotTokenInput>;

/** Тип вставки шаблона бота по таблице Drizzle */
export type StorageBotTemplateInput = typeof botTemplates.$inferInsert;

/** Тип обновления шаблона бота */
export type StorageBotTemplateUpdate = Partial<StorageBotTemplateInput>;

/** Тип вставки группы бота по таблице Drizzle */
export type StorageBotGroupInput = typeof botGroups.$inferInsert;

/** Тип обновления группы бота */
export type StorageBotGroupUpdate = Partial<StorageBotGroupInput>;

/** Тип вставки участника группы по таблице Drizzle */
export type StorageGroupMemberInput = typeof groupMembers.$inferInsert;

/** Тип обновления участника группы */
export type StorageGroupMemberUpdate = Partial<StorageGroupMemberInput>;

/** Тип вставки пользовательских данных бота по таблице Drizzle */
export type StorageUserBotDataInput = typeof userBotData.$inferInsert;

/** Тип обновления пользовательских данных бота */
export type StorageUserBotDataUpdate = Partial<StorageUserBotDataInput>;

/** Тип вставки сообщения бота по таблице Drizzle */
export type StorageBotMessageInput = typeof botMessages.$inferInsert;

/** Тип вставки связи сообщения и медиа по таблице Drizzle */
export type StorageBotMessageMediaInput = typeof botMessageMedia.$inferInsert;

/** Тип вставки медиафайла по таблице Drizzle */
export type StorageMediaFileInput = typeof mediaFiles.$inferInsert;

/** Тип обновления медиафайла */
export type StorageMediaFileUpdate = Partial<StorageMediaFileInput>;

/** Тип вставки записи лога по таблице Drizzle */
export type StorageBotLogInput = typeof botLogs.$inferInsert;

/** Тип вставки записи истории запуска по таблице Drizzle */
export type StorageBotLaunchHistoryInput = typeof botLaunchHistory.$inferInsert;

/** Тип обновления записи истории запуска */
export type StorageBotLaunchHistoryUpdate = Partial<StorageBotLaunchHistoryInput>;

/** Тип вставки Telegram-пользователя по таблице Drizzle */
export type StorageTelegramUserInput = typeof telegramUsers.$inferInsert;
