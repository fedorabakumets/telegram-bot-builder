/** @fileoverview Проверка и подготовка индивидуальных настроек, наследуемых от проекта. */
import { z } from 'zod';
import { BOT_INHERITED_SETTING_KEYS, type BotInheritedSettingKey } from '../../shared/bot-inherited-settings';
import { isMessagesRetentionDays } from '../../shared/messages-retention';
import type { botTokens } from '@shared/schema';
import type { RuntimeModeChange } from './runtimeModeBatch';
import { RuntimeModeValidationError } from './runtimeModePolicy';

/** Индивидуальные поля хранятся отдельно от источника значения. */
type OwnBotSettings = Pick<typeof botTokens.$inferInsert, BotInheritedSettingKey>;
/** Явное нулевое или пустое значение сохраняется как индивидуальная настройка. */
export type BotInheritedSettingChanges = { [K in BotInheritedSettingKey]?: OwnBotSettings[K] | 'inherit' };

/** Ключи формы окружения, которым соответствуют поля токена. */
const inheritedEnvFields = {
  SAVE_INCOMING_MEDIA: 'saveIncomingMedia', MESSAGES_RETENTION_DAYS: 'messagesRetentionDays',
  CONTENT_CACHE: 'contentCache', LOG_LEVEL: 'logLevel', CATCH_ALL_HANDLERS: 'catchAllHandlers',
  TRACK_USER_BLOCKS: 'trackUserBlocks', TRACK_GROUP_MEMBERSHIP: 'trackGroupMembership',
  PROTECT_CONTENT: 'protectContent', WEBHOOK_BASE_URL: 'webhookBaseUrl',
} as const satisfies Record<string, BotInheritedSettingKey>;

/** Возвращает наследуемое поле только для известного системного ключа. */
export function inheritedBotSettingForEnv(key: string): BotInheritedSettingKey | undefined {
  return Object.prototype.hasOwnProperty.call(inheritedEnvFields, key)
    ? inheritedEnvFields[key as keyof typeof inheritedEnvFields] : undefined;
}

/** Проверяет итоговые значения системных полей до первой записи пакета. */
export function parseBotInheritedSettingsBatch(changes: RuntimeModeChange[]): BotInheritedSettingChanges {
  const parsed: Array<[BotInheritedSettingKey, number | string | null]> = [];
  for (const { key, action, value } of changes) {
    if (action !== 'update' || !key) continue;
    const field = inheritedBotSettingForEnv(key);
    if (!field) continue;
    if (value === 'inherit') { parsed.push([field, value]); continue; }
    if (field === 'webhookBaseUrl') {
      if (value === '' || value === null) { parsed.push([field, null]); continue; }
      const url = typeof value === 'string' ? value.trim() : value;
      if (z.url().safeParse(url).success && typeof url === 'string') { parsed.push([field, url]); continue; }
    } else if (field === 'logLevel') {
      if (typeof value === 'string' && ['DEBUG', 'INFO', 'WARNING', 'ERROR'].includes(value)) {
        parsed.push([field, value]); continue;
      }
    } else if (field === 'messagesRetentionDays') {
      if (typeof value === 'string' && /^\d+$/.test(value) && isMessagesRetentionDays(Number(value))) {
        parsed.push([field, Number(value)]); continue;
      }
    } else {
      if (value === '1' || value === 'true') { parsed.push([field, 1]); continue; }
      if (value === '0' || value === 'false') { parsed.push([field, 0]); continue; }
    }
    throw new RuntimeModeValidationError(`Недопустимое значение настройки ${key}`);
  }
  return Object.fromEntries(parsed);
}

/** Обновляет источники только указанных полей, сохраняя значения при наследовании. */
export function buildBotInheritedSettingsPatch(current: readonly string[], changes: BotInheritedSettingChanges) {
  const inherited = new Set(current);
  const own: Array<[BotInheritedSettingKey, unknown]> = [];
  for (const field of BOT_INHERITED_SETTING_KEYS) {
    const value = changes[field];
    if (value === undefined) continue;
    if (value === 'inherit') inherited.add(field);
    else {
      inherited.delete(field);
      own.push([field, value]);
    }
  }
  return { ...Object.fromEntries(own) as Partial<OwnBotSettings>, inheritBotSettings: Array.from(inherited) };
}
