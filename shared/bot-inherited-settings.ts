/** @fileoverview Значения и источники наследуемых настроек работы бота. */

import { isMessagesRetentionDays } from './messages-retention';

/** Настройки, для которых бот может использовать значения проекта. */
export const BOT_INHERITED_SETTING_KEYS = [
  'saveIncomingMedia', 'messagesRetentionDays', 'contentCache', 'logLevel',
  'catchAllHandlers', 'trackUserBlocks', 'trackGroupMembership', 'protectContent', 'webhookBaseUrl',
] as const;

/** Ключ отдельно наследуемой настройки. */
export type BotInheritedSettingKey = (typeof BOT_INHERITED_SETTING_KEYS)[number];

/** Действующие настройки, включая nullable значения старых индивидуальных записей. */
export interface BotInheritedSettings {
  /** Сохранять входящие медиа. */
  saveIncomingMedia: number | null;
  /** Срок хранения сообщений в днях; ноль означает бессрочное хранение. */
  messagesRetentionDays: number;
  /** Кэшировать содержимое бота. */
  contentCache: number | null;
  /** Уровень журналирования. */
  logLevel: string | null;
  /** Обрабатывать сообщения без подходящего действия. */
  catchAllHandlers: number | null;
  /** Отслеживать блокировки бота пользователями. */
  trackUserBlocks: number | null;
  /** Отслеживать участие бота в группах. */
  trackGroupMembership: number | null;
  /** Запрещать пересылку и сохранение содержимого. */
  protectContent: number | null;
  /** Публичный базовый адрес или null для серверного адреса. */
  webhookBaseUrl: string | null;
}

/** Начальные настройки соответствуют полям нового токена в базе. */
export const DEFAULT_BOT_SETTINGS = {
  saveIncomingMedia: 0, messagesRetentionDays: 0, contentCache: 0, logLevel: 'DEBUG',
  catchAllHandlers: 1, trackUserBlocks: 1, trackGroupMembership: 1, protectContent: 0, webhookBaseUrl: null,
} satisfies BotInheritedSettings;

/** Уровни журналирования, которые можно сохранить на проекте. */
const LOG_LEVELS = ['DEBUG', 'INFO', 'WARNING', 'ERROR'];

/** Индивидуальные поля бота, которые могут переопределять значения проекта. */
type BotOverrides = Partial<BotInheritedSettings> & {
  /** Поля, использующие значения проекта вместо индивидуальной настройки. */
  inheritBotSettings?: readonly string[] | null;
};

/**
 * Проверяет флаг из сохранённого JSON проекта.
 * @param value - Сохранённое значение.
 * @param fallback - Начальное значение поля.
 * @returns Один из допустимых флагов.
 */
function flag(value: unknown, fallback: number): number {
  return value === 0 || value === 1 ? value : fallback;
}

/**
 * Заполняет отсутствующие значения проекта начальными настройками.
 * @param defaults - Сохранённые настройки проекта.
 * @returns Полный набор настроек проекта.
 */
export function resolveProjectBotSettings(defaults?: Record<string, unknown> | null): BotInheritedSettings {
  const data = defaults ?? {};
  return {
    saveIncomingMedia: flag(data.saveIncomingMedia, DEFAULT_BOT_SETTINGS.saveIncomingMedia),
    messagesRetentionDays: typeof data.messagesRetentionDays === 'number' && isMessagesRetentionDays(data.messagesRetentionDays)
      ? data.messagesRetentionDays : DEFAULT_BOT_SETTINGS.messagesRetentionDays,
    contentCache: flag(data.contentCache, DEFAULT_BOT_SETTINGS.contentCache),
    logLevel: typeof data.logLevel === 'string' && LOG_LEVELS.includes(data.logLevel)
      ? data.logLevel : DEFAULT_BOT_SETTINGS.logLevel,
    catchAllHandlers: flag(data.catchAllHandlers, DEFAULT_BOT_SETTINGS.catchAllHandlers),
    trackUserBlocks: flag(data.trackUserBlocks, DEFAULT_BOT_SETTINGS.trackUserBlocks),
    trackGroupMembership: flag(data.trackGroupMembership, DEFAULT_BOT_SETTINGS.trackGroupMembership),
    protectContent: flag(data.protectContent, DEFAULT_BOT_SETTINGS.protectContent),
    webhookBaseUrl: typeof data.webhookBaseUrl === 'string' ? data.webhookBaseUrl : DEFAULT_BOT_SETTINGS.webhookBaseUrl,
  };
}

/**
 * Разрешает источник каждого параметра, сохраняя явные нулевые и nullable значения бота.
 * @param defaults - Сохранённые значения проекта.
 * @param token - Индивидуальные значения бота и список наследуемых полей.
 * @returns Действующие настройки бота.
 */
export function resolveBotInheritedSettings(
  defaults: Record<string, unknown> | null | undefined, token?: BotOverrides | null,
): BotInheritedSettings {
  const project = resolveProjectBotSettings(defaults);
  const result: BotInheritedSettings = { ...DEFAULT_BOT_SETTINGS };
  /**
   * Записывает значение с источником, выбранным для конкретного поля.
   * @param key - Ключ наследуемой настройки.
   */
  function assign<K extends BotInheritedSettingKey>(key: K): void {
    const own = token?.[key];
    if (token?.inheritBotSettings?.includes(key)) result[key] = project[key];
    else if (own !== undefined) result[key] = own;
  }
  for (const key of BOT_INHERITED_SETTING_KEYS) assign(key);
  return result;
}
