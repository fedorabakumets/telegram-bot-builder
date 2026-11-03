/** @fileoverview Общие контракты безопасных настроек бота для MCP и HTTP. */
import { z } from 'zod';
/** Булев флаг исторического API. */
const flag = z.union([z.literal(0), z.literal(1)]);
/** Варианты настроек: маршрут определяется только разрешённым режимом. */
export const botSettingsChangeSchema = z.discriminatedUnion('setting', [
  z.object({ setting: z.literal('auto-restart'), autoRestart: flag, maxRestartAttempts: z.number().int().min(1).max(10) }),
  z.object({ setting: z.literal('protect-content'), protectContent: flag }),
  z.object({ setting: z.literal('save-incoming-media'), saveIncomingMedia: flag }),
  z.object({ setting: z.literal('catch-all-handlers'), catchAllHandlers: flag }),
  z.object({ setting: z.literal('track-user-blocks'), trackUserBlocks: flag }),
  z.object({ setting: z.literal('track-group-membership'), trackGroupMembership: flag }),
  z.object({ setting: z.literal('content-cache'), contentCache: flag }),
  z.object({ setting: z.literal('log-level'), logLevel: z.enum(['DEBUG', 'INFO', 'WARNING', 'ERROR']) }),
  z.object({ setting: z.literal('launch-settings'), launchMode: z.enum(['polling', 'webhook']), webhookBaseUrl: z.string().url().nullable().optional(), webhookSecretToken: z.string().max(256).regex(/^[A-Za-z0-9_-]*$/).nullable().optional() }),
]);
/** Поля профиля, изменяемые через Telegram. */
export const botProfileBodySchema = z.object({
  /** Изменяемое поле профиля. */
  field: z.enum(['name', 'description', 'shortDescription']),
  /** Значение поля. */
  value: z.string().max(512),
});
