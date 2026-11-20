/** @fileoverview Общие контракты безопасных настроек бота для MCP и HTTP. */
import { z } from 'zod';
/** Булев флаг исторического API. */
const flag = z.union([z.literal(0), z.literal(1)]);
/** Флаг отдельного бота или значение проекта. */
const inheritedFlag = z.union([flag, z.literal('inherit')]);
/** Частичное изменение позволяет переопределять два поля независимо. */
export const botAutoRestartBodySchema = z.object({
  /** Индивидуальный флаг или возврат к общему. */
  autoRestart: z.union([flag, z.literal('inherit')]).optional(),
  /** Индивидуальный лимит или возврат к общему. */
  maxRestartAttempts: z.union([z.number().int().min(1).max(10), z.literal('inherit')]).optional(),
});
/** Варианты настроек: маршрут определяется только разрешённым режимом. */
export const botSettingsChangeSchema = z.discriminatedUnion('setting', [
  botAutoRestartBodySchema.extend({ setting: z.literal('auto-restart') }),
  z.object({ setting: z.literal('protect-content'), protectContent: inheritedFlag }),
  z.object({ setting: z.literal('save-incoming-media'), saveIncomingMedia: inheritedFlag }),
  z.object({ setting: z.literal('catch-all-handlers'), catchAllHandlers: inheritedFlag }),
  z.object({ setting: z.literal('track-user-blocks'), trackUserBlocks: inheritedFlag }),
  z.object({ setting: z.literal('track-group-membership'), trackGroupMembership: inheritedFlag }),
  z.object({ setting: z.literal('content-cache'), contentCache: inheritedFlag }),
  z.object({ setting: z.literal('log-level'), logLevel: z.enum(['DEBUG', 'INFO', 'WARNING', 'ERROR', 'inherit']) }),
  z.object({ setting: z.literal('launch-settings'), launchMode: z.enum(['inherit', 'polling', 'webhook']).optional(), webhookBaseUrl: z.union([z.url(), z.literal('inherit')]).nullable().optional(), webhookSecretToken: z.string().max(256).regex(/^[A-Za-z0-9_-]*$/).nullable().optional() }),
]);
/** Поля профиля, изменяемые через Telegram. */
export const botProfileBodySchema = z.object({
  /** Изменяемое поле профиля. */
  field: z.enum(['name', 'description', 'shortDescription']),
  /** Значение поля. */
  value: z.string().max(512),
});
