/** @fileoverview Общие контракты базы пользователей и ответов для HTTP и MCP. */
import { z } from 'zod';
/** Положительный безопасный идентификатор. */
export const userDataIdSchema = z.number().int().positive().max(Number.MAX_SAFE_INTEGER);
/** Фильтры постраничного чтения базы пользователей. */
export const userDataQuerySchema = z.object({
  /** Явно выбранный бот. */
  tokenId: userDataIdSchema,
  /** Размер страницы. */
  limit: z.number().int().min(1).max(100).default(20),
  /** Смещение страницы. */
  offset: z.number().int().min(0).default(0),
  /** Поиск по пользователю. */
  search: z.string().max(200).optional(),
  /** Состояние активности. */
  filterActive: z.enum(['true', 'false']).optional(),
  /** Поле сортировки. */
  sortBy: z.enum(['lastInteraction', 'createdAt', 'interactionCount', 'firstName', 'userName']).optional(),
  /** Направление сортировки. */
  sortDir: z.enum(['asc', 'desc']).optional(),
});
/** Изменение поддерживаемого сервером состояния пользователя. */
export const updateUserDataBodySchema = z.object({
  /** Активен ли пользователь. */
  isActive: z.boolean(),
});
