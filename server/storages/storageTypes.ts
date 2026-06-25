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
  projectCollaborators,
  botEnvVariables,
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

/** Тип вставки Telegram-пользователя по таблице Drizzle */
export type StorageTelegramUserInput = typeof telegramUsers.$inferInsert;

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

/** Тип вставки коллаборатора проекта по таблице Drizzle */
export type StorageProjectCollaboratorInput = typeof projectCollaborators.$inferInsert;

import { broadcasts, broadcastResults } from "@shared/schema";

/** Тип вставки рассылки по таблице Drizzle */
export type StorageBroadcastInput = typeof broadcasts.$inferInsert;

/** Тип обновления рассылки */
export type StorageBroadcastUpdate = Partial<StorageBroadcastInput>;

/** Тип вставки результата рассылки по таблице Drizzle */
export type StorageBroadcastResultInput = typeof broadcastResults.$inferInsert;

/** Тип вставки переменной окружения бота по таблице Drizzle */
export type StorageBotEnvVariableInput = typeof botEnvVariables.$inferInsert;

/** Тип обновления переменной окружения бота */
export type StorageBotEnvVariableUpdate = Partial<Omit<StorageBotEnvVariableInput, 'tokenId'>>;

import { botTables, botTableColumns, botTableRows } from "@shared/schema";

/** Тип вставки пользовательской таблицы по таблице Drizzle */
export type StorageBotTableInput = typeof botTables.$inferInsert;

/** Тип обновления пользовательской таблицы */
export type StorageBotTableUpdate = Partial<StorageBotTableInput>;

/** Тип вставки колонки пользовательской таблицы по таблице Drizzle */
export type StorageBotTableColumnInput = typeof botTableColumns.$inferInsert;

/** Тип вставки строки пользовательской таблицы по таблице Drizzle */
export type StorageBotTableRowInput = typeof botTableRows.$inferInsert;

/** Тип обновления строки пользовательской таблицы */
export type StorageBotTableRowUpdate = Partial<StorageBotTableRowInput>;

import { workerProcesses } from "@shared/schema";

/** Тип вставки записи процесса воркера по таблице Drizzle */
export type StorageWorkerProcessInput = typeof workerProcesses.$inferInsert;

/** Тип обновления записи процесса воркера */
export type StorageWorkerProcessUpdate = Partial<StorageWorkerProcessInput>;

import { agentTokens } from "@shared/schema";

/** Тип вставки персонального токена агента по таблице Drizzle */
export type StorageAgentTokenInput = typeof agentTokens.$inferInsert;
