/**
 * @fileoverview Схема фильтров аудитории рассылок — вынесена отдельно,
 * чтобы её могли использовать и broadcasts, и broadcast-campaigns без циклического импорта
 * @module shared/schema/tables/broadcast-filters
 */

import { z } from "zod";

/** Схема фильтров аудитории рассылки */
export const broadcastFiltersSchema = z.object({
  /** Теги для фильтрации пользователей */
  tags: z.array(z.string()).optional(),
  /** Дата регистрации от (ISO) */
  registeredFrom: z.string().optional(),
  /** Дата регистрации до (ISO) */
  registeredTo: z.string().optional(),
  /** Последняя активность от (ISO) */
  activeFrom: z.string().optional(),
  /** Последняя активность до (ISO) */
  activeTo: z.string().optional(),
  /** Массив userId выбранных вручную пользователей */
  userIds: z.array(z.string()).optional(),
  /** Массив groupId (Telegram chat_id) выбранных групп */
  groupIds: z.array(z.string()).optional(),
});

/** Тип фильтров аудитории */
export type BroadcastFilters = z.infer<typeof broadcastFiltersSchema>;
