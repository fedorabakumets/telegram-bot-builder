/** @fileoverview Точные публичные ответы управления сессиями без внутренней cookie. */
import './common';
import { z } from 'zod';
/** Публичные метаданные Redis-сессии после удаления sessionId. */
export const ProfileSessionSchema = z.object({
  /** Публичный идентификатор. */
  id: z.string(),
  /** Владелец Telegram. */
  userId: z.number(),
  /** Название браузера и устройства. */
  device: z.string(),
  /** Категория устройства. */
  kind: z.enum(['desktop', 'mobile']),
  /** Последний адрес, если известен. */
  ip: z.string().nullable().optional(),
  /** Время создания. */
  createdAt: z.string(),
  /** Последняя активность. */
  lastActive: z.string(),
  /** Совпадение с текущей сессией. */
  isCurrent: z.boolean(),
}).openapi('ProfileSession');
/** Список активных сессий. */
export const ProfileSessionsSchema = z.object({ sessions: z.array(ProfileSessionSchema) });
/** Ответ успешного завершения сессии. */
export const SessionRevokedSchema = z.object({ success: z.literal(true) });
/** Число завершённых остальных сессий. */
export const OtherSessionsRevokedSchema = SessionRevokedSchema.extend({ revoked: z.number().int().nonnegative() });
/** Ошибка реестра сессий. */
export const SessionRegistryErrorSchema = z.object({ error: z.string() });
/** Ошибка requireAuth. */
export const SessionUnauthorizedSchema = z.object({ success: z.literal(false), message: z.string() });
